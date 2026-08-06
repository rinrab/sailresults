import { Button, Divider, Field, Input, Text } from "@fluentui/react-components";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import EditableText from "./editable-text";
import ResultsOverview from "./results-overview";
import { StorageContext } from "./storage-context";

export function NewSeriesState() {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);

  const [name, setName] = React.useState("");

  const done = () => {
    const id = storage.newSeries(name);
    navigate(`/series/${id}/`);
  };

  return (
    <Layout>
      <NavBar>
        <NavBarItem title="New Series" to="" />
      </NavBar>
      <Content>
        <form
          onSubmit={done}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}>
          <Input placeholder="Series Name" required
                 onChange={e => setName(e.target.value)} />
          <div style={{ flex: 1 }} />
          <Button type="submit">Create</Button>
        </form>
      </Content>
    </Layout>
  );
}

export function SeriesOverviewState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  
  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.current.name} to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto" }}>
          <Text block size={700}>Series Overview</Text>
          <Divider style={{ margin: "8px 0" }} />

          <Button onClick={() => navigate("config")} style={{ width: "200px", margin: "8px 0" }}>Change Configuration</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500} style={{ margin: "8px 0" }} >Results</Text>
          <ResultsOverview series={series.current} />
          <Button onClick={() => navigate("results")} style={{ width: "200px", margin: "8px 0" }}>View Full Results</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500}>Competitors</Text>
          <Text block>{series.current.racers.length} people are racing in this ragatta.</Text>
          <Button onClick={() => navigate("competitors")} style={{ width: "200px", margin: "8px 0" }}>Edit Competitors</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500}>Races</Text>
          <Text block>There are {series.current.finishboards.length} races.</Text>
          <Button onClick={() => navigate("races")} style={{ width: "200px", margin: "8px 0" }}>Edit Races</Button>
        </div>
      </Content>
    </Layout>
  );
}

export function SeriesConfigurationState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  
  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.current.name} to=".." />
        <NavBarItem title="Configuration" to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto", flex: 1 }}>
          <h1>Series Configuration</h1>

          <Field label="Name">
            <Input value={series.current.name}
                   onChange={(e) => series.setName(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("..")}>Back</Button>
        </div>
      </Content>
    </Layout>
  );
}
