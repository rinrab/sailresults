import { Breadcrumb, BreadcrumbItem, Button, Checkbox, Divider, FluentProvider, Input, List, ListItem, Text, webLightTheme } from "@fluentui/react-components";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

interface Racer {
  name: string;
  number: string;
  isChecked: boolean;
}

const enum AppState {
  StartMenu,
  NewSeries,
  RaceView,
  NewRace,
}

function RacerRow({ racer, updateRacer }) {
  return (
    <tr>
      <td>
        <Checkbox
          checked={racer.isChecked}
          onChange={e => {
            const value = e.target.checked;
            updateRacer(racer, { ...racer, isChecked: value });
          }}
        />
      </td>
      <td>{racer.name == "" ? "-" : racer.name}</td>
      <td>{racer.number == "" ? "-" : racer.number}</td>
    </tr>
  );
}

function RacersList({ racers, updateRacer }) {
  return (
    <table style={{ width: "100%" }}>
      <thead>
        <th style={{ width: 0 }}></th>
        <th>Name</th>
        <th>Number</th>
      </thead>
      <tbody>
        {
          racers.map((item, index) =>
            <RacerRow racer={item} updateRacer={updateRacer} key={index} />) 
        }
      </tbody>
    </table>);
}

function NewSeriesState() {
  const [racers, setRacers] = useState<Racer[]>([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const submit = () => {
      const newRacer = {
          name: name.trim(),
          number: number.trim(),
          isChecked: true,
      };
      setRacers([...racers, newRacer]);
      setName("");
      setNumber("");
  }

  const updateRacer = (racer: Racer, newValue: Racer) => {
    setRacers(racers.map(item => {
      if (item == racer) {
        return newValue;
      } else {
        return item;
      }
    }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <Input placeholder="Enter Series Name..." />
      <Divider style={{ flex: "0", padding: "8px 0" }} />
      <form style={{ display: "flex", gap: 8 }}
            onSubmit={e => { e.preventDefault(); submit(); }}>
        <Input placeholder="Name" value={name}
               onChange={e => setName(e.target.value)}
               style={{ flexGrow: 3 }} />
        <Input placeholder="Sail Number" value={number}
               onChange={e => setNumber(e.target.value)}
               style={{ flexGrow: 3 }} />
        <Button type="submit"
                style={{ width: "200px" }}>Add</Button>
      </form>
      <Divider style={{ flex: "0", padding: "8px 0" }} />
      <div style={{ flex: "auto" }}>
        {
          racers.length == 0 
            ? <Text>No racers added.</Text> 
            : <RacersList racers={racers} updateRacer={updateRacer} />
        }
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button>
          Contunue with {racers.filter(item => item.isChecked).length} racers
        </Button>
      </div>
    </div>
  );
}

function StartState({setState}) {
  return <Button onClick={() => setState(AppState.NewSeries)}>
    Create New Series</Button>;
}

function StateManager({ state, setState }) {
  if (state == AppState.StartMenu) {
    return <StartState setState={setState} />
  } else if (state == AppState.NewSeries) {
    return <NewSeriesState />
  } else {
    throw "tuff day";
  }
}

function App() {
  const [state, setState] = useState(AppState.StartMenu);
  return <StateManager state={state} setState={setState} />
}

root.render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <div style={{
        height: "calc(100vh - 16px)",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ flex: "auto" }}>
          <App />
        </div>
        <div>footer</div>
      </div>
    </FluentProvider>
  </React.StrictMode>
);
