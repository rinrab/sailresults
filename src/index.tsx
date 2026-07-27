import {  Button, Checkbox, Divider, FluentProvider, Input,  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableSelectionCell, Text, webLightTheme } from "@fluentui/react-components";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

let globalRacerId = 67;

interface Racer {
  id: number;
  name: string;
  number: string;
  isChecked: boolean;
}

interface EvaluatedRacer {
  racer: Racer,
  scores: number[],
  total: number,
}

function evaluateScoreboard(racers: Racer[], finishBoards: number[][]) {
  const result: EvaluatedRacer[] = [];
  for (const racer of racers) {
    const scores: number[] = [];
    let total = 0;

    for (const board of finishBoards) {
      const index = board.findIndex(item => item == racer.id); 
      if (index == -1) {
        total += racers.length + 1;
        scores.push(-1);
      } else {
        /* plus-one to convert from index to real score that is used for
         * further calculations */
        total += index + 1;
        scores.push(index + 1);
      }
    }

    result.push({
      racer: racer,
      scores: scores,
      total: total,
    });
  }
  return result.sort((a, b) => a.total - b.total);
}

const enum AppState {
  StartMenu,
  NewSeries,
  RaceView,
  NewRace,
}

function RacerRow({ racer, updateRacer }) {
  return (
    <TableRow>
      <TableSelectionCell
        checked={racer.isChecked}
        onChange={e => {
          const value = e.target.checked;
          updateRacer(racer, { ...racer, isChecked: value });
        }}
      />
      <TableCell>{racer.name == "" ? "-" : racer.name}</TableCell>
      <TableCell>{racer.number == "" ? "-" : racer.number}</TableCell>
    </TableRow>
  );
}

function RacersList({ racers, updateRacer }) {
  return (
    <Table style={{ width: "100%" }}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell style={{ width: "1%" }}></TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Number</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {
          racers.map(item =>
            <RacerRow racer={item} updateRacer={updateRacer} key={item.id} />) 
        }
      </TableBody>
    </Table>);
}

function NewSeriesState({ setState, racers, setRacers }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const submit = () => {
      const newRacer = {
          id: globalRacerId++,
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
        <Button onClick={() => setState(AppState.RaceView)}>
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

function formatRaceScore(score: number) {
  if (score < 0) {
    return "DNS";
  } else {
    return score.toString();
  }
}

function RaceViewState({ racers, finishboards, setState }) {
  const scoreboard = evaluateScoreboard(racers, finishboards );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{flex: "auto"}}>
        <Table style={{ width: "100%" }}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Place</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Number</TableHeaderCell>
              {Array.from(
                { length: scoreboard[0].scores.length },
                (_, i) => <TableHeaderCell key={i}>Race {i + 1}</TableHeaderCell>) }
              <TableHeaderCell>Total</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              scoreboard.map((racer, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{racer.racer.name == "" ? "-" : racer.racer.name}</TableCell>
                  <TableCell>{racer.racer.number == "" ? "-" : racer.racer.number}</TableCell>
                  { racer.scores.map((score, index) =>
                     <TableCell key={index}>{formatRaceScore(score)}</TableCell>) }
                  <TableHeaderCell>{racer.total}</TableHeaderCell>
                </TableRow>
                )) 
            }
          </TableBody>
        </Table>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={() => setState(AppState.NewRace)}>New Race</Button>
      </div>
    </div>
  );
}

function StateManager({ state, setState }) {
  const [racers, setRacers] = useState<Racer[]>([]);
  const [finishboards, setFinishboards] = useState<number[][]>([[67, 68]]);

  if (state == AppState.StartMenu) {
    return <StartState setState={setState} />
  } else if (state == AppState.NewSeries) {
    return <NewSeriesState 
      setState={setState}
      racers={racers}
      setRacers={setRacers}
    />
  } else if (state == AppState.RaceView) {
    return <RaceViewState
      racers={racers}
      finishboards={finishboards}
      setState={setState}
    />
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
