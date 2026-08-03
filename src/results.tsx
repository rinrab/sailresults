import { Button, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Text, TableColumnSizingOptions, TableRow, TableCell, TableHeaderCell, TableHeader, Table, TableBody } from "@fluentui/react-components";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, NavBarItem } from "./common";
import { EvaluatedScore, evaluateScoreboard } from "./scoring";
import { useSeries, useRacers } from "./storage";

function ScoreCell({ score }: { score: EvaluatedScore }) {
  return <>
    <Text>{score.finishboardEntry}</Text>
    {score.finishboardEntry != score.realScore &&
      <Text><br />{score.realScore}</Text>
    }
  </>
}

function ResultsPrint({ scoreboard, series }) {
  return (
    <div>
      <h1>{series.name}</h1>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "right" }}>Rank</th>
            <th>Name</th>
            <th>Number</th>
            {series.finishboards.map((_, index) =>
              <th key={index} style={{ textAlign: "center" }}>R{index + 1}</th>
            )}
            <th style={{ textAlign: "center" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {scoreboard.map((row, racerIndex) =>
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

function ResultRow({ rank, row }) {
  return (
    <TableRow>
      <Cell width={40} align="right">{rank}</Cell>
      <Cell width={150}>{formatString(row.racer.name)}</Cell>
      <Cell width={120}>{formatString(row.racer.number)}</Cell>
      {row.scores.map((score, scoreIndex) =>
        <Cell key={scoreIndex} width={40} align="center">
          <ScoreCell score={score} />
        </Cell>)}
      <Cell width={70} bold align="center">{row.total}</Cell>
    </TableRow>
  );
}


export default function ResultsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();
  const scoreboard = evaluateScoreboard(racers, series, series.finishboards);

  return (
    <Layout print={<ResultsPrint scoreboard={scoreboard} series={series} />}>
      <NavBar>
        <NavBarItem title={series.name} to=".." />
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
                {series.finishboards.map((_, index) =>
                  <Cell key={index} width={40} align="center">R{index + 1}</Cell>
                )}
                <Cell width={70} align="center">Total</Cell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoreboard.map((row, index) =>
                <ResultRow key={index} rank={index + 1} row={row} />
              )}
            </TableBody>
          </Table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("../races/new")}>New Race</Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </Content>
    </Layout>
  );
}
