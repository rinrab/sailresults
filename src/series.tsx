import { Button, Divider, Input, Text } from "@fluentui/react-components";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem, nextRacerId, Series, useLocalStorage, useSeries, useSeriesList } from "./common";
import EditableText from "./editable-text";
import ResultsOverview from "./results-overview";

export function NewSeriesState() {
  const [draft, setDraft] = useLocalStorage<Series>("draft-series", () => ({
    id: nextRacerId(),
    name: "",
    racers: [],
    finishboards: [],
    draftFinishboard: null
  }));
  const navigate = useNavigate();
  const [series, setSeries] = useSeriesList();

  const done = (e) => {
    e.preventDefault();
    setSeries({ ...series, [draft.id]: draft });
    setDraft(null);
    navigate(`/series/${draft.id}/`);
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
                 onChange={e => setDraft({ ...draft, name: e.target.value })} />
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
  const [series, setSeries] = useSeries(parseInt(seriesId));

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.name} to="" />
        <NavBarItem title="Overview" to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto" }}>
          <Text block size={700}>Series Overview</Text>
          <Divider style={{ margin: "8px 0" }} />

          <Text block size={500} style={{ margin: "8px 0" }} >Settings</Text>
          <Text weight="semibold">Name</Text>
          <div style={{ maxWidth: 300 }}>
            <EditableText rejectEmpty value={series.name}
                          setValue={value => setSeries({...series, name: value })} />
          </div>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500} style={{ margin: "8px 0" }} >Results</Text>
          <ResultsOverview seriesId={seriesId} />
          <Button onClick={() => navigate("results")} style={{ width: "200px", margin: "8px 0" }}>View Full Results</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500}>Competitors</Text>
          <Text block>{series.racers.length} people are racing in this ragatta.</Text>
          <Button onClick={() => navigate("competitors")} style={{ width: "200px", margin: "8px 0" }}>Edit Competitors</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500}>Races</Text>
          <Text block>There are {series.finishboards.length} races.</Text>
          <Button onClick={() => navigate("races")} style={{ width: "200px", margin: "8px 0" }}>Edit Races</Button>
        </div>
      </Content>
    </Layout>
  );
}
