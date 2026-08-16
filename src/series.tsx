import { Button, Card, CardHeader, Divider, Field, Input, Text, Textarea, tokens } from "@fluentui/react-components";
import { ChevronRight24Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, SeriesNavigation } from "./common";
import ResultsOverview from "./results-overview";
import { StorageContext } from "./storage-context";
import { toCSV } from "./export-import";
import { exportSeries } from "./storage";

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
      <NavBar title="New Series" back="../.." />
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
      <NavBar title={series.current.name} back="../.." />
      <Content>
        <div style={{ overflow: "auto", padding: 8 }}>
          <h2>Series Overview</h2>

          <Card onClick={() => navigate("competitors")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Competitors</h3>}
                        description={<>{series.current.racers.length} people are racing in this ragatta.</>}
                        action={<ChevronRight24Regular /> } />
          </Card>

          <Card onClick={() => navigate("races")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Races</h3>}
                        description={<>There are {series.current.finishboards.length} races.</>}
                        action={<ChevronRight24Regular /> } />
          </Card>

          <Card onClick={() => navigate("results")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Results</h3>}
                        description={<ResultsOverview series={series.current} />}
                        action={<ChevronRight24Regular /> } />
          </Card>

          <Card onClick={() => navigate("config")} style={{ marginBottom: 12 }}>
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Configuration</h3>}
                        description={<><b>Name:</b>&nbsp;{series.current.name}</>}
                        action={<ChevronRight24Regular /> } />
          </Card>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}

export function SeriesConfigurationState() {
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));

  const csv = React.useMemo(() =>
    toCSV(exportSeries(series)),
    [series.current]
  );
  
  return (
    <Layout>
      <NavBar title={series.current.name} subtitle="Configuration" />
      <Content>
        <div style={{ overflow: "auto", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}> 
            <h1>Series Configuration</h1>

            <Field label="Name">
              <Input value={series.current.name}
                     onChange={(e) => series.setName(e.target.value)} />
            </Field>

            <Field label="Edit raw CSV">
              <Textarea readOnly resize="vertical"
                        value={csv}
                        textarea={{
                          style: {
                            height: 200,
                            fontFamily: tokens.fontFamilyMonospace 
                          }
                        }} />
            </Field>
          </div>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
