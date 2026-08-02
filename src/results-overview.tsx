import { Text, TableBody, TableRow, TableCell, Table } from "@fluentui/react-components";
import React from "react";
import { formatString } from "./common";
import { useRacers, useSeries } from "./storage";
import { evaluateScoreboard } from "./scoring";

export default function ResultsOverview({ seriesId }) {
  const [series] = useSeries(seriesId);
  const [racers] = useRacers();

  if (series.finishboards.length == 0) {
    return <div>
      <Text block>Results overview cannot be displayed.</Text>
      <Text block>There are no races yet.</Text>
    </div>
  } else {
    const scoreboard = evaluateScoreboard(racers, series, series.finishboards);

    const emojis = ["🥇", "🥈", "🥉"];

    return <div>
      <Table>
        <TableBody>
          {scoreboard.slice(0, 3).map((racer, index) =>
            <TableRow key={index}>
              <TableCell style={{ width: 20 }}>{emojis[index]}</TableCell>
              <TableCell>{formatString(racer.racer.name)}</TableCell>
              <TableCell>{formatString(racer.racer.number)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {scoreboard.length > 3 && <div style={{ marginTop: 8 }}>
        <Text>{scoreboard.length - 3} racers are not shown.</Text>
      </div>}
    </div>
  }
}
