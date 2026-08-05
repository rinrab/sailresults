import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem, Card, CardHeader } from "@fluentui/react-components";
import { MoreHorizontalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import EditableText from "./editable-text";
import { StorageContext } from "./storage-context";
import { ISeriesEditor } from "./storage";

function RacersList(props: { series: ISeriesEditor }) {
  const storage = React.useContext(StorageContext);

  if (props.series.current.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return <div style={{ overflow: "auto", flex: 1 }}>
      {props.series.current.racers.map((id) => {
        const racer = storage.openRacer(id);
        return <Card key={id} style={{ marginBottom: 8 }}>
          <CardHeader action={
            <Menu>
              <MenuTrigger>
                <Button appearance="transparent"
                        icon={<MoreHorizontalRegular />} />
              </MenuTrigger>
              <MenuPopover>
                <MenuItem onClick={() => props.series.removeRacer(id)}>Delete</MenuItem>
              </MenuPopover>
            </Menu>
            }
            description={
              <div style={{ width: "100%" }}>
                <EditableText title="Name" 
                              value={racer.current.name}
                              setValue={(value) => racer.setName(value)} />
                <div style={{ height: 8 }} />
                <EditableText title="Number" 
                              value={racer.current.number}
                              setValue={(value) => racer.setNumber(value)} />
              </div>
            }
            ></CardHeader>
        </Card>
      })}
    </div>
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
    series.addRacer(id);
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
