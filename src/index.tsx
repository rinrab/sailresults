import { Option, Button, Combobox, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Divider, FluentProvider, Input, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableSelectionCell, Text, tokens, webLightTheme, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, ChevronDown20Regular, Home24Filled, Warning16Regular } from "@fluentui/react-icons";
import React, {  useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

function getStoredObject<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value) ?? fallback;
    } catch {
      return fallback;
    }
  } else {
    return fallback;
  }
}

function setStoredObject<T>(key: string, value?: T) {
  if (value) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
  }
}

function useLocalStorage<T>(key: string, fallback: T): [T, (newValue?: T) => void] {
  const obj = getStoredObject(key, fallback);
  const [value, setValue] = useState(obj);
  return [
    value,
    (newValue: T) => {
      setStoredObject(key, newValue);
      setValue(newValue);
    }
  ];
}

function nextRacerId() {
  const id = getStoredObject("globalRacerId", 67) + 1;
  setStoredObject("globalRacerId", id);
  return id;
}

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
          id: nextRacerId(),
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: 8 }}>
      <Input placeholder="Enter Series Name..." />
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

function formatString(str: string) {
  return (str == "") ? "-" : str;
}

function RaceViewState({ racers, finishboards, setState }) {
  const scoreboard = evaluateScoreboard(racers, finishboards );

  const columns = [
    createTableColumn({
      columnId: "place",
      renderHeaderCell: () => "Place",
      renderCell: (index: number) => index,
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

  for (let i = 0; i < scoreboard[0].scores.length; i++) {
    columns.push(createTableColumn({
      columnId: "race" + i,
      renderHeaderCell: () => `Race ${i + 1}`,
      renderCell: (index: number) => formatRaceScore(scoreboard[index].scores[i]),
    }));
  }

  columns.push(createTableColumn({
    columnId: "total",
    renderHeaderCell: () => "Total",
    renderCell: (index: number) => scoreboard[index].total,
  }));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: 8 }}>
      <div style={{ overflow: "auto", flex: "auto" }}>
        <DataGrid
          items={racers.map((_, i) => i)}
          columns={columns}
          getRowId={(item) => item}
          focusMode="none"
          resizableColumns
          resizableColumnsOptions={{
            autoFitColumns: false,
          }} >
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>
                  {renderHeaderCell()}
                </DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody>
            {({ item, rowId }) => (
              <DataGridRow key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>
                    {renderCell(item)}
                  </DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={() => setState(AppState.NewRace)}>New Race</Button>
      </div>
    </div>
  );
}

function racerMatches(racer: Racer, query: string) {
  return (racer.name + racer.number).toLowerCase().includes(query);
}

function FinishBoardSuggestions({ racers, finishboard, query }) {
  const pickableItems = racers.filter(item => ! finishboard.includes(item.id));
  const filteredItems = pickableItems.filter(item => racerMatches(item, query));

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
  };

  if (pickableItems.length == 0) {
    return <><Text style={itemStyle}>
      The finish board is completed!</Text></>
  } else if (filteredItems.length == 0) {
    return <><Text style={itemStyle}>
      No racers matched by this query.</Text></>
  } else {
    return (<>
      {filteredItems.map(item => {
        const text = `${item.name} ${item.number}`;
        return <Option key={item.id} text={text} value={item.id}>{text}</Option>;
      })}
    </>)
  }
}

function FinishboardBad({ remaining }) {
  return <div>
    <Warning16Regular style={{
      color: tokens.colorPaletteDarkOrangeForeground1,
      margin: "-2px 4px" }} />
    <Text>
      Note: {remaining} remaining racers will be added as DNS.
    </Text>
  </div>;
}

function FinishboardGood() {
  return <div>
    <CheckmarkCircle16Regular style={{
      color: tokens.colorPaletteGreenForeground1,
      margin: "-2px 4px" }} />
    <Text>
    The finish board is fine!
    </Text>
  </div>;
}

function NewRaceState({ racers, finishboards, setFinishboards, setState }) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useLocalStorage<number[]>("draft-finishboard", []);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const remainingRacers = racers.length - draft.length;

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      gap: 8,
      height: "100%" }}>
      <div style={{ position: "relative" }}>
        <Combobox
          ref={inputRef}
          style={{ width: "100%", maxWidth: "100%" }} 
          placeholder="Start typing to fill the finish board in..."
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)} 
          onOptionSelect={(_, data) => {
            setDraft([...draft, parseInt(data.optionValue)]);
            setQuery("");
          }}
        >
        {<FinishBoardSuggestions 
            racers={racers}
            finishboard={draft}
            query={query} />}
        </Combobox>
      </div>
      <div style={{ flex: "auto", overflow: "auto" }}>
        <Table style={{}}>
          <TableBody>
            {draft.map((item, index) => {
              const racer = racers.find(racer => racer.id == item);
              return <TableRow key={racer.id}>
                <TableCell style={{ width: "35px" }}>{index + 1}</TableCell>
                <TableCell>{racer.name} {racer.number}</TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: "1 1 300px", margin: "auto" }}>
          {draft.length < racers.length 
            ? <FinishboardBad remaining={remainingRacers} />
            : <FinishboardGood /> }
        </div>
        <div style={{ flex: "1 1 150px", display: "flex", gap: 8 }}>
          <div style={{ flex: "auto" }} />
          <Button onClick={() => setState(AppState.RaceView)}>Back</Button>
          <Button onClick={() => setDraft([])}>Clear</Button>
          <Button onClick={() => {
            setState(AppState.RaceView);
            setFinishboards([...finishboards, draft]);
            setDraft(null);
          }}>Continue</Button>
        </div>
      </div>
    </div>
  )
}

function StateManager({ state, setState }) {
  const [racers, setRacers] =
    useLocalStorage<Racer[]>("racers", []);
  const [finishboards, setFinishboards] =
    useLocalStorage<number[][]>("finishboards", []);

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
  } else if (state == AppState.NewRace) {
    return <NewRaceState 
      racers={racers}
      finishboards={finishboards}
      setFinishboards={setFinishboards}
      setState={setState} />
  } else {
    throw "tuff day";
  }
}

function parseStateFromLocation(): AppState {
  const hash = window.location.hash;
  if (hash == "#new-series") {
    return AppState.NewSeries;
  } else if (hash == "#score-table") {
    return AppState.RaceView;
  } else if (hash == "#new-race") {
    return AppState.NewRace;
  } else {
    return AppState.StartMenu;
  }
}

function useLocationState() {
  const [state, setState] = useState(parseStateFromLocation());

  window.onhashchange = () => {
    setState(parseStateFromLocation());
  };

  return [state, (newValue) => {
    setState(newValue);
    if (newValue == AppState.StartMenu) {
      window.location.hash = "";
    } else if (newValue == AppState.NewSeries) {
      window.location.hash = "new-series";
    } else if (newValue == AppState.RaceView) {
      window.location.hash = "score-table";
    } else if (newValue == AppState.NewRace) {
      window.location.hash = "new-race";
    }
  }];
}

function stateToTitle(state: AppState): string {
  if (state == AppState.StartMenu) {
    return "Main Menu";
  } else if (state == AppState.NewRace) {
    return "New Race";
  } else if (state == AppState.NewSeries) {
    return "Competitors";
  } else if (state == AppState.RaceView) {
    return "Results";
  }
}

function NavBar({ state, setState }) {
  return (
    <Breadcrumb style={{
      padding: "4px 8px",
      backgroundColor: tokens.colorNeutralBackground4 }}>
      <BreadcrumbItem>
        <BreadcrumbButton onClick={() => setState(AppState.StartMenu)}>
          <Home24Filled />
        </BreadcrumbButton>
        <BreadcrumbDivider />
        <BreadcrumbButton onClick={() => setState(AppState.RaceView)}>
          Regatta 23
        </BreadcrumbButton>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <BreadcrumbButton>
                {stateToTitle(state)}
                <ChevronDown20Regular style={{ marginLeft: 4 }} />
              </BreadcrumbButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setState(AppState.RaceView)}>Results</MenuItem>
                <MenuItem onClick={() => setState(AppState.NewRace)}>New Race</MenuItem>
                <MenuItem onClick={() => setState(AppState.NewSeries)}>Competitors</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </BreadcrumbItem>
      </BreadcrumbItem>
    </Breadcrumb>);
}


function App() {
  const [state, setState] = useLocationState();

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <NavBar state={state} setState={setState} />
      <Divider style={{ flex: 0 }} />
      <div style={{ flex: "1", padding: "8px", minHeight: "0" }}>
        <StateManager state={state} setState={setState} />
      </div>
    </div>
  );
}

root.render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} style={{ height: "100%" }}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
