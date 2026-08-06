import { Button, Card, CardHeader, Divider, Field, Input, Text } from "@fluentui/react-components";
import { ChevronRight24Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import ResultsOverview from "./results-overview";
import { StorageContext } from "./storage-context";

export function NewSeriesState() {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);

  const [name, setName] = React.useState("");

  const done = (e) => {
    e.preventDefault();
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
          <h2>Series Overview</h2>

          <Card onClick={() => navigate("results")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Results</h3>}
                        description={<ResultsOverview series={series.current} />}
                        action={<ChevronRight24Regular /> } />
          </Card>

          <Card onClick={() => navigate("races")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Races</h3>}
                        description={<>There are {series.current.finishboards.length} races.</>}
                        action={<ChevronRight24Regular /> } />
          </Card>

          <Card onClick={() => navigate("competitors")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Competitors</h3>}
                        description={<>{series.current.racers.length} people are racing in this ragatta.</>}
                        action={<ChevronRight24Regular /> } />
          </Card>

          <Card onClick={() => navigate("config")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Configuration</h3>}
                        description={<><b>Name:</b>&nbsp;{series.current.name}</>}
                        action={<ChevronRight24Regular /> } />
          </Card>
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
