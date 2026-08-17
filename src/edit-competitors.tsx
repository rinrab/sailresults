import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem, Field } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, SeriesNavigation } from "./common";
import { StorageContext } from "./storage-context";
import { ISeriesEditor } from "./storage";
import { Column, SailTable } from "./table";
import { Racer } from "./scoring";

function ActionsCell({ deleteFn }) {
  return <Menu>
    <MenuTrigger>
      <Button icon={<MoreVerticalRegular />} appearance="transparent"
              onClick={(e) => e.stopPropagation()} />
    </MenuTrigger>
    <MenuPopover>
      <MenuItem onClick={(e) => {
        e.stopPropagation();
        deleteFn();
      }}>Delete</MenuItem>
    </MenuPopover>
  </Menu>
}

function RacersList(props: { series: ISeriesEditor }) {
  const navigate = useNavigate();

  const columns: Column<Racer>[] = [
    {
      header: "#",
      size: 40,
      align: "end",
      cell: (_, index) => <Text>{index + 1}</Text>,
    },
    {
      header: "Name",
      minsize: 120,
      cell: (row) => <Text>{row.name}</Text>,
    },
    {
      header: "Number",
      minsize: 120,
      cell: (row) => <Text>{row.number}</Text>,
    },
    {
      header: "",
      size: 32,
      cell: (row) => {
        return <ActionsCell deleteFn={() => props.series.deleteRacer(row.id)} />
      }
    }
  ];

  if (props.series.current.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return <SailTable<Racer, Racer> 
      columns={columns}
      keys={props.series.current.racers}
      map={racer => racer}
      onSelect={(racer) => navigate(racer.id.toString())} />
  }
}
export function ListCompetitorsState() {
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));

  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");

  const submit = () => {
    series.newRacer(name.trim(), number.trim());

    /* clear inputs */
    setName("");
    setNumber("");
  }

  return (
    <Layout>
      <NavBar title={series.current.name}
              subtitle="Competitors" />
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
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}

function getRacerDescription(racer: Racer) {
  if (racer.name == "" && racer.number == "") {
    return "<No name>";
  } else if (racer.name == "") {
    return racer.number;
  } else if (racer.number == "") {
    return racer.name;
  } else {
    return `${racer.name} / ${racer.number}`;
  }
}

export function EditCompetitorState() {
  const { seriesId, racerId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const racer = series.openRacer(parseInt(racerId));
  const navigate = useNavigate();

  return (
    <Layout>
      <NavBar title={series.current.name}
              subtitle={getRacerDescription(racer.current)} />
      <Content>
        <h1>Editing Competitor</h1>
        <form style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          <Field style={{ flex: "0" }} label="Name">
            <Input placeholder="Name" value={racer.current.name}
                   onChange={e => racer.setName(e.target.value)} />
          </Field>
          <Field style={{ flex: "0" }} label="Number">
            <Input placeholder="Name" value={racer.current.number}
                   onChange={e => racer.setNumber(e.target.value)} />
          </Field>
        </form>
        <div style={{ display: "flex", justifyContent: "end" }}>
          <Button onClick={() => {
            series.deleteRacer(racer.current.id)
            navigate("..");
          }}>Delete</Button>
        </div>
      </Content>
    </Layout>
  );
}
