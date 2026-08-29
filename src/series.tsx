import { Button, Card, CardHeader, Divider, Field, Input, Text, Textarea, tokens } from "@fluentui/react-components";
import { ChevronRight24Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, SeriesNavigation } from "./common";
import ResultsOverview from "./results-overview";
import { StorageContext } from "./storage-context";
import { doExport, fromCSV, toCSV } from "./export-import";
import { makeSeriesPack } from "./storage";

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

function ImportSeriesDetails({ name, setName, csv, setcsv, parsed, error }) {
  return (
    <>
      <Field label="Series Name">
        <Input required value={name}
               onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="Edit CSV">
        <Textarea resize="vertical"
                  value={csv} onChange={(e) => setcsv(e.target.value)}
                  textarea={{
                    style: {
                      height: 200,
                      fontFamily: tokens.fontFamilyMonospace 
                    }
                  }} />
      </Field>
      <Text>{error}</Text>
    </>
  );
}

export function ImportSeriesState() {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);

  const [name, setName] = React.useState("");
  const [csv, setcsv] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const { parsed, error } = React.useMemo(() => {
    console.log("parse")
    try {
      const parsed = fromCSV(csv);
      parsed.name = name;
      console.log(parsed)
      return { parsed };
    } catch (error) {
      return { error: error.toString() as string };
    }
  }, [csv, name]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const done = (e) => {
    e.preventDefault();
    const id = storage.importSeries(parsed);
    navigate(`/series/${id}/`);
  };

  return (
    <Layout>
      <NavBar title="Import Series" back="../.." />
      <Content>
        <form
          onSubmit={done}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 8
          }}>
          <input ref={inputRef} type="file" 
                 onChange={async (e) => {
                   const file = e.target.files?.[0] ?? null;
                   setFile(file);
                   if (file) {
                     setName(file.name.replace(/\..*/, ""));
                     setcsv(await file.text());
                   }
                 }} />
          {file && <ImportSeriesDetails name={name} setName={setName}
                                        csv={csv} setcsv={setcsv}
                                        parsed={parsed} error={error} />}
          <div style={{ flex: 1 }} />
          <Button type="submit" disabled={!!error}>Import</Button>
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
      <NavBar title={series.current.name}
              subtitle="Overview"
              back="../.." />
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
            <CardHeader header={<h3 style={{ margin: "0 0 4px 0" }}>Settings</h3>}
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

  return (
    <Layout>
      <NavBar title={series.current.name}
              subtitle="Settings" />
      <Content>
        <div style={{ overflow: "auto", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}> 
            <h1>Series Configuration</h1>

            <Field label="Name">
              <Input value={series.current.name}
                     onChange={(e) => series.setName(e.target.value)} />
            </Field>

          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "end" }}>
          <Button onClick={() => doExport(makeSeriesPack(series.current))}>Export</Button>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
