import { Button, Divider, Text, Card, Body1, CardFooter, MenuTrigger, Menu, MenuPopover, MenuItem, CardHeader } from "@fluentui/react-components";
import { MoreHorizontalRegular, Open16Regular } from "@fluentui/react-icons";
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
                alert("not implemented");
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
      </NavBar>
      <Content>
        <div style={{ overflow: "auto" }}>
          <div style={{ textAlign: "center" }}>
            <h1>SailResults</h1>
            <div>
              <Button style={{ width: 200, marginRight: 8 }} 
                      onClick={() => navigate("docs")}>
                Read the docs
              </Button>
              <Button style={{ width: 200, marginRight: 8 }} 
                      onClick={() => navigate(`/series/new`)}>
                Create New Series
              </Button>
              <Menu>
                <MenuTrigger>
                  <Button style={{ width: 200 }}>Sample regattas</Button>
                </MenuTrigger>
                <MenuPopover>
                  {samples.map((sample, index) =>
                    <MenuItem onClick={() => createSample(sample)}
                              key={index}>{sample.name}</MenuItem>
                  )}
                </MenuPopover>
              </Menu>
            </div>
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
