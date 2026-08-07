import { Button, Text, TableRow, TableCell, TableHeader, Table, TableBody } from "@fluentui/react-components";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, NavBarItem, SeriesNavigation } from "./common";
import { EvaluatedRacer, EvaluatedScore, evaluateScoreboard, Series } from "./scoring";
import { StorageContext } from "./storage-context";

function ScoreCell(props: { score: EvaluatedScore }) {
  return <>
    <Text>{props.score.finishboardEntry}</Text>
    {props.score.finishboardEntry != props.score.realScore &&
      <Text><br />{props.score.realScore}</Text>
    }
  </>
}

function ResultsPrint(props: { scoreboard: EvaluatedRacer[], series: Series }) {
  return (
    <div>
      <h1>{props.series.name}</h1>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "right" }}>Rank</th>
            <th>Name</th>
            <th>Number</th>
            {props.series.finishboards.map((_, index) =>
              <th key={index} style={{ textAlign: "center" }}>R{index + 1}</th>
            )}
            <th style={{ textAlign: "center" }}>Total</th>
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
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

function Cell({ width, align = "left", bold = false, children }) {
  return (
    <TableCell style={{
      minWidth: width,
      textAlign: align as any,
      fontWeight: bold ? "bold" : "normal",
    }}>
      {children}
    </TableCell>
  );
}

function ResultRow(props: { row: EvaluatedRacer }) {
  return (
    <TableRow>
      <Cell width={40} align="right">{props.row.rank}</Cell>
      <Cell width={150}>{formatString(props.row.racer.name)}</Cell>
      <Cell width={120}>{formatString(props.row.racer.number)}</Cell>
      {props.row.scores.map((score, scoreIndex) =>
        <Cell key={scoreIndex} width={40} align="center">
          <ScoreCell score={score} />
        </Cell>)}
      <Cell width={70} bold align="center">{props.row.total}</Cell>
    </TableRow>
  );
}


export default function ResultsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const racers = storage.listRacers();
  const scoreboard = evaluateScoreboard(racers, series.current, series.current.finishboards);

  return (
    <Layout print={<ResultsPrint scoreboard={scoreboard} series={series.current} />}>
      <NavBar>
        <NavBarItem title={series.current.name} to=".." />
        <NavBarItem title="Results" to="" />
      </NavBar>
      <Content screenOnly>
        <div style={{ overflow: "auto", flex: "auto" }}>
          <Table style={{ tableLayout: "auto" }}>
            <TableHeader>
              <TableRow>
                <Cell width={40} align="right">Rank</Cell>
                <Cell width={150}>Name</Cell>
                <Cell width={120}>Number</Cell>
                {series.current.finishboards.map((_, index) =>
                  <Cell key={index} width={40} align="center">R{index + 1}</Cell>
                )}
                <Cell width={70} align="center">Total</Cell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoreboard.map((row, index) =>
                <ResultRow key={index} row={row} />
              )}
            </TableBody>
          </Table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("../races/new")}>New Race</Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
