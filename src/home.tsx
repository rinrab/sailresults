import { Button, Divider, Text, Card, Body1, CardFooter } from "@fluentui/react-components";
import { Open16Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import ResultsOverview from "./results-overview";
import { useSeriesList } from "./storage";
import { Series } from "./scoring";

function SeriesCard({ series }) {
  const navigate = useNavigate();

  return (
    <Card style={{
      maxWidth: "400px",
      width: "100%",
      height: "fit-content",
      marginBottom: 8}}
    >
      <Body1 as="h5" style={{ margin: 0, fontWeight: "bold" }}>
        {series.name}
      </Body1>
      <Text>{3} races / {series.racers.length} competitors</Text>

      <ResultsOverview seriesId={series.id} />
      
      <CardFooter>
        <Button appearance="primary" icon={<Open16Regular />}
                onClick={() => navigate(`/series/${series.id}/`)}>Open</Button>
      </CardFooter>
    </Card>
  );
}

export default function StartState() {
  const navigate = useNavigate();
  const [series, _] = useSeriesList();

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
              <Button style={{ width: 200 }} 
                      onClick={() => navigate(`/series/new`)}>
                Create New Series
              </Button>
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
