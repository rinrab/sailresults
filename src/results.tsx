import { Button, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Text, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, TableColumnSizingOptions } from "@fluentui/react-components";
import { Delete16Regular, Edit16Regular, MoreHorizontalRegular, New16Regular } from "@fluentui/react-icons";
import React, {   } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, evaluateScoreboard, formatString, Layout, NavBar, NavBarItem, useRacers, useSeries } from "./common";

function ResultsPrint({ scoreboard, racers, series }) {
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
            <th style={{ textAlign: "right" }}>Total</th>
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
                  <Text>{score.finishboardEntry}</Text>
                  {score.finishboardEntry != score.realScore &&
                    <Text><br />{score.realScore}</Text>
                  }
                </td>)
              }
              <td style={{ textAlign: "right", fontWeight: "bolder" }}>{row.total}</td>
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
  const [series] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();
  const scoreboard = evaluateScoreboard(racers, series, series.finishboards);

  const columns = [
    createTableColumn({
      columnId: "rank",
      renderHeaderCell: () => "Rank",
      renderCell: (index: number) => <Text style={{ width: "100%" }} align="end">{index + 1}</Text>,
    }),
    createTableColumn({
      columnId: "name",
      renderHeaderCell: () => "Name",
      renderCell: (index: number) => formatString(scoreboard[index].racer.name),
    }),
    createTableColumn({
      columnId: "number",
      renderHeaderCell: () => "Number",
      renderCell: (index: number) => formatString(scoreboard[index].racer.number),
    }),
  ];

  const columnSizingOptions: TableColumnSizingOptions = {
    "rank": { idealWidth: 35, minWidth: 35 },
    "name": {},
    "number": {},
    "total": {},
  };

  for (let i = 0; i < series.finishboards.length; i++) {
    columns.push(createTableColumn({
      columnId: "race" + i,
      renderHeaderCell: () => (
        <div style={{ width: "100%", display: "flex" }}>
          <Text style={{ flex: "1", margin: "auto" }}>{i + 1}</Text>
          <div>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<MoreHorizontalRegular />} appearance="transparent" />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => navigate(`../races/new`)}
                            icon={<New16Regular />}>New Race</MenuItem>
                  <MenuItem onClick={() => navigate(`../races/${i}/edit`)}
                            icon={ <Edit16Regular /> }>Edit Race</MenuItem>
                  <MenuItem onClick={() => alert("dont kill me :(")}
                            icon={ <Delete16Regular /> }>Delete Race</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
      ),
      renderCell: (index: number) => {
        const { finishboardEntry, realScore } = scoreboard[index].scores[i];
        return <div style={{ width: "100%", textAlign: "center" }}>
          <Text>{finishboardEntry}</Text>
          {finishboardEntry != realScore.toString() &&
            <Text><br />{scoreboard[index].scores[i].realScore}</Text>
          }
        </div>
      },
    }));
    columnSizingOptions["race" + i] = { idealWidth: 40, minWidth: 40 };
  }

  columns.push(createTableColumn({
    columnId: "total",
    renderHeaderCell: () => "Total",
    renderCell: (index: number) => <Text weight="semibold">{scoreboard[index].total}</Text>
  }));

  return (
    <Layout print={<ResultsPrint racers={racers} scoreboard={scoreboard} series={series} />}>
      <NavBar>
        <NavBarItem title={series.name} to=".." />
        <NavBarItem title="Results" to="" />
      </NavBar>
      <Content screenOnly>
        <div style={{ overflow: "auto", flex: "auto" }}>
          <DataGrid
            items={scoreboard.map((_, i) => i)}
            columns={columns}
            getRowId={(item) => item}
            focusMode="none"
            resizableColumns
            resizableColumnsOptions={{
              autoFitColumns: true,
            }}
            columnSizingOptions={columnSizingOptions} >
            <DataGridHeader>
              <DataGridRow>
                {( column ) => (
                  <DataGridHeaderCell>
                    {column.renderHeaderCell()}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody>
              {({ item, rowId }) => 
                <DataGridRow key={rowId}>
                  {(column) => (
                    <DataGridCell focusMode="group">
                      {column.renderCell(item)}
                    </DataGridCell>
                  )}
                </DataGridRow>
              }
            </DataGridBody>
          </DataGrid>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("../races/new")}>New Race</Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </Content>
    </Layout>
  );
}
