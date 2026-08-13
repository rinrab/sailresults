import { Button, Divider, Card, MenuTrigger, Menu, MenuPopover, MenuItem, CardHeader } from "@fluentui/react-components";
import { Add48Regular, ChevronRight24Regular, MoreHorizontalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Content, Layout } from "./common";
import ResultsOverview from "./results-overview";
import { Series } from "./scoring";
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

      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <div style={{ flex: 1 }}>
          <ResultsOverview series={props.series} />
        </div>
        <ChevronRight24Regular />
      </div>
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
      <Content>
        <div style={{ overflow: "auto" }}>
          <div style={{ textAlign: "center" }}>
            <img src="/assets/wide-staging.svg" style={{ height: 64 }} />
          </div>
          <h2>Features</h2>
          <FeaturesList />
          <Divider style={{ margin: "8px 0" }} />
          <h2>Recent Series</h2>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            padding: 8,
            columnGap: "16px",
            rowGap: "36px" }}>
            <Card style={{ 
                    display: "flex",
                    alignItems: "center",
                    height: 120,
                    maxWidth: "400px",
                  }}
                  onClick={() => navigate("/series/new")}>
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
