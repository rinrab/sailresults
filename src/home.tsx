import { Button, Divider, Text, Card, Body1, CardFooter, MenuTrigger, Menu, MenuPopover, MenuItem, CardHeader, SplitButton, MenuGroupHeader, MenuDivider } from "@fluentui/react-components";
import { BookQuestionMarkRegular, DocumentAddRegular, MoreHorizontalRegular, NewRegular, Open16Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import ResultsOverview from "./results-overview";
import { Series } from "./scoring";
import { samples } from "./sample-data";
import { importSeries, PackedSeries } from "./storage";
import { StorageContext } from "./storage-context";

function SeriesCard(props: { series: Series }) {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);

  return (
    <Card appearance="filled"
          onClick={() => navigate(`/series/${props.series.id}/`)}
          style={{
            maxWidth: "400px",
            width: "100%",
            height: "fit-content",
            marginBottom: 8
          }}
      >

      <CardHeader 
        header={<b>{props.series.name}</b>}
        description={<div>{props.series.finishboards.length} races / {props.series.racers.length} competitors</div>}
        action={
          <Menu>
            <MenuTrigger>
              <Button appearance="transparent"
                      onClick={(e) => e.stopPropagation()}
                      icon={<MoreHorizontalRegular />} />
            </MenuTrigger>
            <MenuPopover>
              <MenuItem onClick={(e) => {
                e.stopPropagation();
                storage.deleteSeries(props.series.id);
              }}>Delete</MenuItem>
            </MenuPopover>
          </Menu>
        }
      />

      <ResultsOverview series={props.series} />
    </Card>
  );
}

export default function StartState() {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);
  const series = storage.listSeries();

  const createSample = (sample: PackedSeries) => {
    const id = importSeries(storage, sample);
    navigate(`/series/${id}`);
  };

  return (
    <Layout>
      <NavBar>
        <NavBarItem title="Main Menu" to="" />
        <div style={{ flex: 1 }} />
        <Menu positioning="below-end">
          <MenuTrigger>
            {(triggerProps) => (
              <SplitButton
                menuButton={triggerProps}
                icon={<DocumentAddRegular /> }
                primaryActionButton={{ onClick: () => navigate("series/new") }} />
            )}
          </MenuTrigger>

          <MenuPopover>
            <MenuItem onClick={() => navigate("series/new")}>Blank new Series</MenuItem>
            <MenuDivider />
            <MenuGroupHeader>Sample Regattas</MenuGroupHeader>
            {samples.map((sample, index) =>
              <MenuItem onClick={() => createSample(sample)}
                        key={index}>{sample.name}</MenuItem>
            )}
          </MenuPopover>
        </Menu>
        <Button onClick={() => navigate("docs")}
                icon={<BookQuestionMarkRegular />}
                style={{ marginLeft: 4 }} />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto" }}>
          <div style={{ textAlign: "center" }}>
            <h1>SailResults</h1>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <h2>Recent Series</h2>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            columnGap: "16px",
            rowGap: "36px" }}>
            {Object.values(series).map((item: Series) => (
              <SeriesCard key={item.id} series={item} />
            ))}
          </div>
        </div>
      </Content>
    </Layout>
  );
}
