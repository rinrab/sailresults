import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem, TableBody, TableRow, TableCell, Table, TableHeader, TableHeaderCell } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import EditableText from "./editable-text";
import { Racer } from "./scoring";
import { useSeries, useRacers, nextRacerId } from "./storage";

function RacersList({ series, racers, updateRacer, deleteRacer }) {
  if (series.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Number</TableHeaderCell>
            <TableHeaderCell style={{ width: 25 }}></TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.racers.map(id => (
            <TableRow key={id.toString()}>
              <TableCell>
                <EditableText value={racers[id].name} compact
                              setValue={(value) => updateRacer({
                                          ...racers[id],
                                          name: value,
                                        })} />
              </TableCell>
              <TableCell>
                <EditableText value={racers[id].number} compact
                              setValue={(value) => updateRacer({
                                          ...racers[id],
                                          number: value,
                                        })} />
              </TableCell>
              <TableCell style={{ width: 25 }}>
                <Menu>
                  <MenuTrigger>
                    <Button icon={<MoreVerticalRegular />} appearance="transparent"
                            onClick={(e) => e.stopPropagation()} />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuItem onClick={() => deleteRacer(id)}>Delete</MenuItem>
                  </MenuPopover>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        <div style={{ flex: "auto", overflow: "auto" }}>
          <RacersList
            series={series}
            racers={racers}
            updateRacer={updateRacer}
            deleteRacer={deleteRacer} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("..")}>Done</Button>
        </div>
      </Content>
    </Layout>
  );
}
