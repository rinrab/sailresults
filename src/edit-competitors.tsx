import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import EditableText from "./editable-text";
import { Racer } from "./scoring";
import { useSeries, useRacers, nextRacerId } from "./storage";
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

function RacersList({ series, racers, updateRacer, deleteRacer }) {
  const columns: Column<Racer>[] = [
    {
      header: "Name",
      cell: (row) => {
        return <EditableText
          value={row.name}
          setValue={(value) => updateRacer({ ...row, name: value, })} />
      }
    },
    {
      header: "Number",
      cell: (row) => {
        return <EditableText
          value={row.number}
          setValue={(value) => updateRacer({ ...row, number: value, })} />
      }
    },
    {
      header: "",
      size: 35,
      cell: (row) => {
        return <ActionsCell deleteFn={() => deleteRacer(row.id)} />
      }
    }
  ];

  const data = React.useMemo(
    () => series.racers.map(id => racers[id]),
    [series.racers, racers],
  )

  if (series.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return <SailTable<Racer> columns={columns}
                             data={data}
                             getKey={row => row.id} />
  }
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
