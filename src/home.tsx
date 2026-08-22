import { Button, Divider, Card, MenuTrigger, Menu, MenuPopover, MenuItem, CardHeader, Text, tokens } from "@fluentui/react-components";
import { Add32Regular, ArrowUpload32Regular, ChevronRight24Regular, MoreHorizontalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Content, Layout, SeriesStatus } from "./common";
import ResultsOverview from "./results-overview";
import { makeSeriesPack, PackedSeries, Series } from "./storage";
import { StorageContext } from "./storage-context";
import { Description, FeaturesList, Resources } from "./docs";
import { doExport } from "./export-import";
import { AccountMenu } from "./account";

function diffDates(target: Date, now: Date) {
  const diff = now.getTime() - target.getTime();

  let seconds = Math.floor(diff / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  if (hours >= 24) {
    return target.toLocaleDateString();
  } else if (hours >= 1) {
    return `${hours} hours ago`;
  } else if (minutes >= 1) {
    return `${minutes} minutes ago`;
  } else {
    return "just now";
  }
}

function compareSeries(a: Series, b: Series) {
  return ((new Date(b.lastEditedTime)).getTime() -
          (new Date(a.lastEditedTime)).getTime());
}

function SeriesCard(props: { series: Series }) {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);

  const now = new Date();
  const lastEdited = new Date(props.series.lastEditedTime);

  return (
    <HomeScreenCard onClick={() => navigate(`/series/${props.series.id}/`)}>
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
                doExport(makeSeriesPack(props.series));
              }}>Export</MenuItem>
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

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center" }}>
        <SeriesStatus series={props.series} />
        <div style={{ flex: 1 }} />
        <Text size={200}>Last edited {diffDates(lastEdited, now)}</Text>
      </div>
    </HomeScreenCard>
  );
}

function HomeScreenCard(props: { onClick: any, style?: any, children: any }) {
  return (
    <Card style={{ 
            ...props.style,
            display: "flex",
          }}
          onClick={props.onClick}>
      {props.children}
    </Card>
  );
}

function Grid({ children }) {
  return <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, auto))",
                padding: 8,
                gap: 12,
              }}>
    {children}
  </div>
}

export default function StartState() {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);
  const series = storage.listSeries();

  const createSample = (sample: PackedSeries) => {
    //const id = importSeries(storage, sample);
    //navigate(`/series/${id}`);
  };

  React.useEffect(() => {
    window.document.title = "SailResults | Sailing Results Scoring Calculator";
  });

  return (
    <Layout>
      <Content>
        <div style={{ overflow: "auto" }}>
          <div style={{ display: "flex", padding: 12, backgroundColor: tokens.colorNeutralBackground4 }}>
            <div style={{ flex: 1 }} />
            <img src="/assets/wide-staging.svg" style={{ height: 64 }} />
            <div style={{ flex: 1, display: "flex", justifyContent: "end", alignItems: "center" }}>
              <AccountMenu />
            </div>
          </div>
          <Description />
          <h2>Features</h2>
          <FeaturesList />
          <h2>Resources</h2>
          <Resources />
          <Divider style={{ margin: "8px 0" }} />
          <h2>Create Series</h2>
          <Grid>
            <HomeScreenCard style={{ alignItems: "center" }}
                            onClick={() => navigate("/series/new")}>
              <div style={{ flex: 1 }} />
              <Add32Regular />
              <div style={{ flex: 1 }} />
              <b>Blank new Series</b>
            </HomeScreenCard>
            <HomeScreenCard style={{ alignItems: "center" }}
                            onClick={() => navigate("/series/import")}>
              <div style={{ flex: 1 }} />
              <ArrowUpload32Regular />
              <div style={{ flex: 1 }} />
              <b>Import Series</b>
            </HomeScreenCard>
          </Grid>
          <h2>Recent Series</h2>
          <Grid>
            {Object.values(series).sort(compareSeries).map((item: Series) => (
              <SeriesCard key={item.id} series={item} />
            ))}
          </Grid>
        </div>
      </Content>
    </Layout>
  );
}
