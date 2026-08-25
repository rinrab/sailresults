import { Button, Link, Text } from "@fluentui/react-components";
import React from "react";
import { useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, SeriesNavigation } from "./common";
import { EvaluatedRacer, EvaluatedScore, evaluateScoreboard } from "./scoring";
import { StorageContext } from "./storage-context";
import { Column, SailTable } from "./table";
import { displayVersion } from "./docs";
import { Series } from "./storage";

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

function ResultsPrint(props: { scoreboard: EvaluatedRacer[], series: Series }) {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>{props.series.name}</h1>
      <table style={{ width: "100%", marginBottom: 40 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "right" }}>#</th>
            <th>Name</th>
            <th>Number</th>
            {props.series.finishboards.map((_, index) =>
              <th key={index} style={{ textAlign: "center" }}>R{index + 1}</th>
            )}
            <th style={{ textAlign: "center" }}>Total</th>
            <th style={{ textAlign: "center" }}>Rank</th>
          </tr>
        </thead>
        <tbody>
          {props.scoreboard.map((row, racerIndex) =>
            <tr key={racerIndex}>
              <td style={{ textAlign: "right" }}>{racerIndex + 1}</td>
              <td>{formatString(row.racer.name)}</td>
              <td>{formatString(row.racer.number)}</td>
              {row.scores.map((score, scoreIndex) =>
                <td key={scoreIndex} style={{ textAlign: "center" }}>
                  <ScoreCell score={score} />
                </td>)}
              <td style={{ textAlign: "center", fontWeight: "bolder" }}>{row.total}</td>
              <td style={{ textAlign: "center" }}>{formatRank(row.rank)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ border: "none" }}>
            <td colSpan={99999} style={{ border: "none", padding: 0 }}>
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
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default function ResultsState() {
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const scoreboard = evaluateScoreboard(series.current, series.current.finishboards);

  const columns: Column<EvaluatedRacer>[] = [
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
      minsize: 120,
      cell: (row) => <Text>{row.racer.number}</Text>,
    },
    ...series.current.finishboards.map((_, index) => ({
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

  return (
    <Layout print={<ResultsPrint scoreboard={scoreboard} series={series.current} />}>
      <NavBar title={series.current.name}
              subtitle="Results" />
      <Content screenOnly>
        <SailTable columns={columns} 
                   data={scoreboard} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
