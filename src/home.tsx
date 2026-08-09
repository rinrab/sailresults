import { Button, Divider, Text, Card, Body1, CardFooter, MenuTrigger, Menu, MenuPopover, MenuItem, CardHeader, SplitButton, MenuGroupHeader, MenuDivider, tokens, CardPreview } from "@fluentui/react-components";
import { Add48Regular, AddRegular, BookQuestionMarkRegular, DocumentAddRegular, MoreHorizontalRegular, NewRegular, Open16Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import ResultsOverview from "./results-overview";
import { Series } from "./scoring";
import { samples } from "./sample-data";
import { importSeries, PackedSeries } from "./storage";
import { StorageContext } from "./storage-context";
import { FeaturesList } from "./docs";

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
            <img src="wide.svg" style={{ height: 64 }} />
          </div>
          <h2>Features</h2>
          <FeaturesList />
          <Divider style={{ margin: "8px 0" }} />
          <h2>Recent Series</h2>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            columnGap: "16px",
            rowGap: "36px" }}>
            <Card style={{ display: "flex", alignItems: "center", height: 120 }} onClick={() => navigate("/series/new")}>
              <div style={{ flex: 1 }} />
              <Add48Regular />
              <div style={{ flex: 1 }} />
              <b>Blank new Series</b>
            </Card>
            {Object.values(series).map((item: Series) => (
              <SeriesCard key={item.id} series={item} />
            ))}
          </div>
        </div>
      </Content>
    </Layout>
  );
}
