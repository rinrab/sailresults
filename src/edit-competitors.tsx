import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import EditableText from "./editable-text";
import { StorageContext, IRacerEditor, ISeriesEditor } from "./storage";
import { Column, SailTable } from "./table";

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

function RacersList(props: { series: ISeriesEditor }) {
  const storage = React.useContext(StorageContext);

  const columns: Column<IRacerEditor>[] = [
    {
      header: "Name",
      minsize: 120,
      cell: (row) => {
        return <EditableText
          value={row.current.name}
          setValue={(value) => row.setName(value)} />
      }
    },
    {
      header: "Number",
      minsize: 120,
      cell: (row) => {
        return <EditableText
          value={row.current.number}
          setValue={(value) => row.setNumber(value)} />
      }
    },
    {
      header: "",
      size: 32,
      cell: (row) => {
        return <ActionsCell deleteFn={() => props.series.removeRacer(row.current.id)} />
      }
    }
  ];

  if (props.series.current.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return <SailTable<number, IRacerEditor> 
      columns={columns}
      keys={props.series.current.racers}
      map={id => storage.openRacer(id)} />
  }
}

export default function EditCompetitorsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));

  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");

  const addRacer = (name: string, number: string) => {
    const id = storage.newRacer();
    const racer = storage.openRacer(id);
    racer.setName(name);
    racer.setNumber(number);
    series.addRacer(racer.current.id);
  };

  const submit = () => {
    addRacer(name.trim(), number.trim());

    /* clear inputs */
    setName("");
    setNumber("");
  }

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.current.name} to=".." />
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
        <RacersList series={series} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("..")}>Done</Button>
        </div>
      </Content>
    </Layout>
  );
}
