import { Button, Text } from "@fluentui/react-components";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, SeriesNavigation } from "./common";
import { EvaluatedRacer, EvaluatedScore, evaluateScoreboard, Series } from "./scoring";
import { StorageContext } from "./storage-context";
import { Column, SailTable } from "./table";

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
      <h1>{props.series.name}</h1>
      <table style={{ width: "100%" }}>
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
      </table>
    </div>
  );
};

export default function ResultsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const racers = storage.listRacers();
  const scoreboard = evaluateScoreboard(racers, series.current, series.current.finishboards);

  const columns: Column<EvaluatedRacer>[] = [
    {
      header: "#",
      cell: (_, index) => <Text>R{index + 1}</Text>,
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
      header: (index + 1).toString(),
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
                   keys={scoreboard}
                   map={key => key} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
