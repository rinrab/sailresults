import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem, TableBody, TableRow, TableCell, Table, TableHeader, TableHeaderCell, tokens } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import EditableText from "./editable-text";
import { Racer } from "./scoring";
import { useSeries, useRacers, nextRacerId } from "./storage";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ColumnDef, getCoreRowModel, useReactTable, flexRender } from "@tanstack/react-table";

function ActionsCell({ deleteFn }) {
  return <Menu>
    <MenuTrigger>
      <Button icon={<MoreVerticalRegular />} appearance="transparent"
              onClick={(e) => e.stopPropagation()} />
    </MenuTrigger>
    <MenuPopover>
      <MenuItem onClick={deleteFn}>Delete</MenuItem>
    </MenuPopover>
  </Menu>
}

function RacersList({ series, racers, updateRacer, deleteRacer }) {
  const columns = React.useMemo<ColumnDef<Racer>[]>(() => [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Number",
      accessorKey: "number",
    },
    {
      header: "",
      accessorKey: "id",
      size: 35,
      cell: (info) => <ActionsCell deleteFn={() => deleteRacer(info.getValue())} />
    }
  ], []);

  const data = React.useMemo(
    () => series.racers.map(item => racers[item]),
    [series, racers],
  )

  const table = useReactTable({
    columns: columns,
    data: data,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      size: 0
    }
  });

  const { rows } = table.getRowModel();

  const parentRef = React.useRef(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const getCellStyles = (size: number) => {
    if (size) {
      return { display: "flex", alignItems: "center", width: size };
    } else {
      return { display: "flex", alignItems: "center", flex: 1 };
    }
  };

  if (series.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return (
      <div ref={parentRef} style={{ overflow: "auto", flex: 1 }}>
        <Table>
          <TableHeader style={{
            display: "grid", 
            position: "sticky",
            top: 0,
            zIndex: 1,
            background: tokens.colorNeutralBackground1Selected,
          }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} style={{ display: "flex" }}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableCell
                      key={header.id}
                      style={getCellStyles(header.column.columnDef.size)}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody style={{ 
            display: "grid",
            height: virtualizer.getTotalSize(),
            position: "relative",
            width: "100%",
          }}>
            {virtualizer.getVirtualItems().map((item) =>
              <TableRow key={item.key} style={{
                  display: "flex",
                  height: item.size,
                  position: "absolute",
                  width: "100%",
                  transform: `translateY(${item.start}px)`,
                }}>
                {rows[item.index].getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={getCellStyles(cell.column.columnDef.size)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  };
}

export default function EditCompetitorsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series, setSeries] = useSeries(parseInt(seriesId));
  const [racers, setRacers] = useRacers();

  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");

  const addRacer = (racer: Racer) => {
    setRacers({
      ...racers,
      [racer.id]: racer,
    });
    setSeries({
      ...series,
      racers: [...series.racers, racer.id],
    });
  };
  const updateRacer = (value: Racer) => {
    const copy = { ...racers };
    copy[value.id] = value;
    setRacers(copy);
  };
  const deleteRacer = (id: number) => {
    setSeries({
      ...series,
      racers: series.racers.filter(item => item != id),
    });
  };

  const submit = () => {
    addRacer({
        id: nextRacerId(),
        name: name.trim(),
        number: number.trim(),
    });

    /* clear inputs */
    setName("");
    setNumber("");
  }

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.name} to=".." />
        <NavBarItem title="Competitors" to="" />
      </NavBar>
      <Content>
        <Divider style={{ flex: "0", padding: "8px 0" }} />
        <form style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
              onSubmit={e => { e.preventDefault(); submit(); }}>
          <Input placeholder="Name" value={name}
                 onChange={e => setName(e.target.value)}
                 style={{ flex: "1 1 200px" }} />
          <Input placeholder="Sail Number" value={number}
                 onChange={e => setNumber(e.target.value)}
                 style={{ flex: "1 1 200px" }} />
          <Button type="submit"
                  style={{ flex: "1 1 70px" }}>Add</Button>
        </form>
        <Divider style={{ flex: "0", padding: "8px 0" }} />
        <RacersList
          series={series}
          racers={racers}
          updateRacer={updateRacer}
          deleteRacer={deleteRacer} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("..")}>Done</Button>
        </div>
      </Content>
    </Layout>
  );
}
