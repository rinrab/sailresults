import { Button, Link, Text } from "@fluentui/react-components";
import React from "react";
import { useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, SeriesNavigation } from "./common";
import { EvaluatedRacer, EvaluatedScore, evaluateScoreboard } from "./scoring";
import { StorageContext } from "./storage-context";
import { Column, SailTable } from "./table";
import { displayVersion } from "./docs";
import { ISeriesEditor, Series } from "./storage";

function ScoreCell(props: { score: EvaluatedScore }) {
  return <div>
    <Text>{props.score.finishboardEntry}</Text>
    {props.score.finishboardEntry != props.score.realScore &&
      <Text><br />{props.score.realScore}</Text>
    }
  </div>
}

function formatRank(rank: number) {
  return (rank == -1) ? "-" : rank.toString();
}

function makeTableColumns(series: Series): Column<EvaluatedRacer>[] {
  return [
    {
      header: "#",
      cell: (_, index) => <Text>{index + 1}</Text>,
      size: 40,
      align: "end",
    },
    {
      header: "Name",
      minsize: 150,
      cell: (row) => <Text>{row.racer.name}</Text>,
    },
    {
      header: "Number",
      minsize: 60,
      cell: (row) => <Text>{row.racer.number}</Text>,
    },
    ...series.finishboards.map((_, index) => ({
      header: `R${index + 1}`,
      size: 40,
      cell: (row) => <ScoreCell score={row.scores[index]} />,
      align: "center",
    } satisfies Column<EvaluatedRacer>)),
    {
      header: <Text weight="bold">Total</Text>,
      size: 70,
      cell: (row) => <Text weight="bold">{row.total}</Text>,
      align: "center",
    },
    {
      header: "Rank",
      cell: (row) => <Text>{formatRank(row.rank)}</Text>,
      size: 40,
      align: "center",
    },
  ];
}

function PrintFooter() {
  return (
    <div style={{
      display: "flex",
      width: "100%",
      marginTop: 8,
      alignItems: "center",
      gap: 4,
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <img src="/assets/wide.svg" style={{ height: 32 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
        <Text block size={200}>Version: {displayVersion()}</Text>
        <Text block size={200}>&copy; 2026 Timofei Zhakov, Rautu, and others</Text>
      </div>
      <div style={{ flex: 1, textAlign: "right" }}>
        <Link>https://www.sailresults.net</Link>
      </div>
    </div>
  );
}

function ResultsPrint(props: { series: Series, scoreboard: EvaluatedRacer[] }) {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>{props.series.name}</h1>
      <SailTable columns={makeTableColumns(props.series)}
                 data={props.scoreboard}
                 printable
                 footer={<PrintFooter />} />
    </div>
  );
};

function ResultsTable(props: { series: Series, scoreboard: EvaluatedRacer[] }) {
  if (props.series.racers.length == 0) {
    return <div>There are no competitors.</div>
  } else if (props.series.finishboards.length == 0) {
    return <div>There are no races.</div>
  } else {
    return <SailTable columns={makeTableColumns(props.series)} 
                      data={props.scoreboard} />
  }
}

export default function ResultsState() {
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const scoreboard = evaluateScoreboard(series.current, series.current.finishboards);

  return (
    <Layout print={<ResultsPrint series={series.current}
                                 scoreboard={scoreboard} />}>
      <NavBar title={series.current.name}
              subtitle="Results" />
      <Content screenOnly>
        <div style={{ display: "flex", flex: 1 }}>
          <ResultsTable series={series.current}
                        scoreboard={scoreboard} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
