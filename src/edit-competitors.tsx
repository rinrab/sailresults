import { Button, Divider, Input, Text, Menu, MenuTrigger, MenuPopover, MenuItem, Field, Link } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, SeriesNavigation } from "./common";
import { StorageContext } from "./storage-context";
import { FinishboardEntry, ISeriesEditor, Racer, Series } from "./storage";
import { Column, SailTable } from "./table";
import { DEFAULT_DISQUALIFICATION, dsqs } from "./scoring";

function ActionsCell({ deleteFn, canDelete }) {
  return <Menu>
    <MenuTrigger>
      <Button icon={<MoreVerticalRegular />} appearance="transparent"
              onClick={(e) => e.stopPropagation()} />
    </MenuTrigger>
    <MenuPopover>
      <MenuItem disabled={! canDelete}
                onClick={(e) => {
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
      size: 2,
      minsize: 120,
      cell: (row) => <Text>{row.name}</Text>,
    },
    {
      header: "Number",
      size: 1,
      minsize: 60,
      cell: (row) => <Text>{row.number}</Text>,
    },
    {
      header: "",
      size: 32,
      cell: (row) => {
        return <ActionsCell deleteFn={() => props.series.deleteRacer(row.id)}
                            canDelete={checkCanDelete(row.id, props.series.current)} />
      }
    }
  ];

  if (props.series.current.racers.length == 0) {
    return <Text>No racers added.</Text>;
  } else {
    return <SailTable<Racer> 
      columns={columns}
      data={props.series.current.racers}
      getKey={(racer) => racer.id}
      onSelect={(racer) => navigate(racer.id.toString())} />
  }
}
export function ListCompetitorsState() {
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));

  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");

  const nameRef = React.useRef<HTMLInputElement>(null);

  const submit = () => {
    series.newRacer(name.trim(), number.trim());

    /* clear inputs */
    setName("");
    setNumber("");

    nameRef.current.focus();
  }

  return (
    <Layout>
      <NavBar title={series.current.name}
              subtitle="Competitors" />
      <Content>
        <Divider style={{ flex: "0", padding: "8px 0" }} />
        <form style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
              onSubmit={e => { e.preventDefault(); submit(); }}>
          <Input ref={nameRef}
                 placeholder="Name" value={name}
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

function checkCanDelete(racerId: number, series: Series) {
  for (const board of series.finishboards) {
    const score = board[racerId];
    if (!score || typeof(score) == "number") {
      return false;
    } else {
      if (dsqs[score].countsAsParticipation) {
        return false;
      }
    }
  }
  return true;
}

function RacesTable(params: { races: FinishboardEntry[] }) {
  const columns: Column<FinishboardEntry>[] = [
    {
      header: "#",
      size: 40,
      align: "end",
      cell: (place, index) => <>R{index + 1}</>
    },
    {
      header: "Place",
      minsize: 60,
      cell: (place, index) => <>{place}</>
    },
  ];

  if (params.races.length == 0) {
    return <>There are no races yet.</>;
  } else {
    return <SailTable columns={columns}
                      data={params.races} />
  }
}

export function EditCompetitorState() {
  const { seriesId, racerId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const racer = series.openRacer(parseInt(racerId));
  const [name, setName] = React.useState(racer.current.name);
  const [number, setNumber] = React.useState(racer.current.number);
  const navigate = useNavigate();

  const done = (e) => {
    e.preventDefault();
    racer.setName(name);
    racer.setNumber(number);
    navigate("..");
  };

  const races: FinishboardEntry[] = series.current.finishboards
    .map(board => board[racer.current.id] ?? DEFAULT_DISQUALIFICATION);

  const disabled = (name == racer.current.name) && (number == racer.current.number);
  const canDelete = checkCanDelete(racer.current.id, series.current);

  return (
    <Layout>
      <NavBar title={series.current.name}
              subtitle={getRacerDescription(racer.current)} />
      <Content>
        <form onSubmit={done} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflow: "auto" }}>
            <h1>Competitor Details</h1>
            <h2>General Information</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field style={{ flex: "0" }} label="Name">
                <Input placeholder="Name" value={name}
                       onChange={e => setName(e.target.value)} />
              </Field>
              <Field style={{ flex: "0" }} label="Number">
                <Input placeholder="Name" value={number}
                       onChange={e => setNumber(e.target.value)} />
              </Field>
            </div>

            <h2>Races</h2>
            <RacesTable races={races} />
            <div style={{ display: "flex", justifyContent: "end", marginTop: 8 }}>
              <Link onClick={() => navigate("../../races")}>View all races</Link>
            </div>

            <h2>Danger Zone</h2>
            {!canDelete && <div style={{ marginBottom: 8 }}>
              Can't delete competitors that had participated in one or more
              races. If you really want to get rid of this person, please first
              manually change all of their placings to DNC/DNS.
            </div>}
            <Button disabled={!canDelete}
                    onClick={() => {
                      series.deleteRacer(racer.current.id);
                      navigate("..");
                    }}>Delete</Button>
          </div>
          <div style={{ display: "flex", justifyContent: "end", gap: 8 }}>
            <Button onClick={() => navigate("..")}>Back</Button>
            <Button disabled={disabled} type="submit">Done</Button>
          </div>
        </form>
      </Content>
    </Layout>
  );
}
