import { Option, Button, Combobox, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Divider, FluentProvider, Input, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableSelectionCell, Text, tokens, webLightTheme, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Card, CardPreview, CardHeader, Body1, CardFooter, MenuButton } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, ChevronDown20Regular, Edit16Regular, Home24Filled, Open16Regular, Warning16Regular } from "@fluentui/react-icons";
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
}

interface EvaluatedRacer {
  racer: Racer,
  scores: number[],
  total: number,
}

interface Series {
  id: number;
  name: string;
  racers: number[];
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
  Competitors,
}

function parseHash(hash: string) {
  const parts = hash.replace("#", "").split("/");

  if (parts.length == 1 && parts[0] == "new-series") {
    return [AppState.NewSeries, null];
  } else if (parts.length == 2) {
    const series = parseInt(parts[0]);
    if (parts[1] == "new-race") {
      return [AppState.NewRace, series];
    } else if (parts[1] == "results") {
      return [AppState.RaceView, series];
    } else if (parts[1] == "competitors") {
      return [AppState.Competitors, series];
    } else {
      return [AppState.StartMenu, null];
    }
  } else {
    return [AppState.StartMenu, null];
  }
}

function toHashLocation(state, series) {
  if (state == AppState.StartMenu) {
    return "";
  } else if (state == AppState.NewSeries) {
    return "new-series"; 
  } else if (state == AppState.RaceView) {
    return `${series}/results`; 
  } else if (state == AppState.NewRace) {
    return `${series}/new-race`; 
  } else if (state == AppState.Competitors) {
    return `${series}/competitors`; 
  } else {
    throw "never hit";
  }
}

function stateIsGlobal(state: AppState) {
  return state == AppState.StartMenu || state == AppState.NewSeries;
}

class State {
  state: AppState;
  series?: number;

  private _setState;
  private _setSeries;

  constructor() {
    const [state, series] = parseHash(window.location.hash);

    [this.state, this._setState] = useState(state);
    [this.series, this._setSeries] = useState(series);

    window.onhashchange = () => {
      const [state, series] = parseHash(window.location.hash);
      this._setState(state);
      this._setSeries(series);
    };
  }

  setState(state: AppState) {
    if (stateIsGlobal(state)) {
      this.navigate(state, null);
    } else if (! this.series) {
      throw "series is not set";
    } else {
      this.navigate(state, this.series);
    }
  }

  navigate(state: AppState, series?: number) {
    this._setState(state);
    this._setSeries(series);
    window.location.hash = toHashLocation(state, series);
  }

  getTitle(): string {
    if (this.state == AppState.StartMenu) {
      return "Main Menu";
    } else if (this.state == AppState.NewRace) {
      return "New Race";
    } else if (this.state == AppState.NewSeries) {
      return "New Series";
    } else if (this.state == AppState.Competitors) {
      return "Competitors";
    } else if (this.state == AppState.RaceView) {
      return "Results";
    }
  }
}

function RacerRow({ racer, series, setSeries }) {
  return (
    <TableRow>
      <TableSelectionCell
        checked={series.racers.includes(racer.id)}
        onChange={e => {
          setSeries({
            ...series,
            racers: (e.target.checked) 
              ? [...series.racers, racer.id] 
              : series.racers.filter(item => item != racer.id),
          });
        }}
      />
      <TableCell>{racer.name == "" ? "-" : racer.name}</TableCell>
      <TableCell>{racer.number == "" ? "-" : racer.number}</TableCell>
    </TableRow>
  );
}

function RacersList({ racers, series, setSeries }) {
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
            <RacerRow
              key={item.id}
              racer={item}
              series={series}
              setSeries={setSeries} />) 
        }
      </TableBody>
    </Table>);
}

function EditSeries({ racers, setRacers, draft, setDraft }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const submit = () => {
    const newRacer = {
        id: nextRacerId(),
        name: name.trim(),
        number: number.trim(),
    };
    setRacers([...racers, newRacer]);
    setName("");
    setNumber("");
    setDraft({
      ...draft,
      racers: [...draft.racers, newRacer.id],
    });
  }

  return (<>
      <Input value={draft.name}  placeholder="Enter Series Name..."
             onChange={e => setDraft({ ...draft, name: e.target.value })} />
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
            : <RacersList racers={racers} series={draft} setSeries={setDraft} />
        }
      </div>
    </>
  );
}

function NewSeriesState({ state, racers, setRacers, series, setSeries }) {
  const [draft, setDraft] = useLocalStorage("draft-series", {
    name: "",
    racers: []
  });

  const done = () => {
    const newSeries = { id: nextRacerId(), ...draft };
    setSeries([...series, newSeries]);
    setDraft(null);
    window.location.hash = `${newSeries.id}/results`;
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: 8 }}>
      <EditSeries
        racers={racers}
        setRacers={setRacers}
        draft={draft}
        setDraft={setDraft} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={done}>
          Contunue with {draft.racers.length} racers
        </Button>
      </div>
    </div>
  );
}

function EditCompetitorsState({ state, id, racers, setRacers, series, setSeries }) {
  const draft = series.find(item => item.id == id);
  const setDraft = (newvalue) => setSeries(series.map(
    item => item.id == id ? newvalue : item));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: 8 }}>
      <EditSeries
        racers={racers}
        setRacers={setRacers}
        draft={draft}
        setDraft={setDraft} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button as="a" href={`#${id}/results`}>Done</Button>
      </div>
    </div>
  );
}

function SeriesCard({ series, state }) {
  return (
    <Card style={{
      maxWidth: "400px",
      width: "100%",
      height: "fit-content" }}>
      <CardPreview>
      </CardPreview>

      <CardHeader
        header={
          <Body1 as="h5" style={{ margin: 0, fontWeight: "bold" }}>
            {series.name}
          </Body1>
        }
        description={`3 races / ${series.racers.length} competitors`} />

      <CardFooter>
        <Button appearance="primary" icon={<Open16Regular />}
                as="a" href={`#${series.id}/results`}>Open</Button>
        <Button icon={<Edit16Regular />}
                as="a" href={`#${series.id}/competitors`}>Edit Competitors</Button>
      </CardFooter>
    </Card>
  );
}

function StartState({ state, series }) {
  return (
    <div style={{ gap: 8, display: "flex", flexDirection: "column" }}>
      <Button as="a" href="#new-series">
        Create New Series</Button>
      <Divider />
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        columnGap: "16px",
        rowGap: "36px" }}>
        {series.map(item => (
          <SeriesCard key={item.id} series={item} state={state} />
        ))}
      </div>
    </div>);
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

function RaceViewState({ racers, finishboards, state }) {
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
        <Button as="a" href={`#${state.series}/new-race`}>New Race</Button>
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

function NewRaceState({ racers, finishboards, setFinishboards, state }) {
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
          <Button as="a" href={`#${state.series}/results`}>Back</Button>
          <Button onClick={() => setDraft([])}>Clear</Button>
          <Button onClick={() => {
            setFinishboards([...finishboards, draft]);
            setDraft(null);
            window.location.hash = `#${state.series}/results`;
          }}>Continue</Button>
        </div>
      </div>
    </div>
  )
}

function StateManager({ state }) {
  const [racers, setRacers] =
    useLocalStorage<Racer[]>("racers", []);
  const [finishboards, setFinishboards] =
    useLocalStorage<number[][]>("finishboards", []);
  const [series, setSeries] =
    useLocalStorage<Series[]>("series", []);

  if (state.state == AppState.StartMenu) {
    return <StartState series={series} state={state} />
  } else if (state.state == AppState.NewSeries) {
    return <NewSeriesState 
      state={state}
      racers={racers}
      setRacers={setRacers}
      series={series}
      setSeries={setSeries}
    />
  } else if (state.state == AppState.Competitors) {
    return <EditCompetitorsState 
      state={state}
      id={state.series}
      racers={racers}
      setRacers={setRacers}
      series={series}
      setSeries={setSeries}
    />
  } else if (state.state == AppState.RaceView) {
    return <RaceViewState
      racers={racers}
      finishboards={finishboards}
      state={state}
    />
  } else if (state.state == AppState.NewRace) {
    return <NewRaceState 
      racers={racers}
      finishboards={finishboards}
      setFinishboards={setFinishboards}
      state={state} />
  } else {
    throw "tuff day";
  }
}

function NavBar({ state }) {
  return (
    <Breadcrumb style={{
      padding: "4px 8px",
      backgroundColor: tokens.colorNeutralBackground4 }}>
      <BreadcrumbItem>
        <BreadcrumbButton href="#">
          <Home24Filled />
        </BreadcrumbButton>
        <BreadcrumbDivider />
        {stateIsGlobal(state.state)
          ? <BreadcrumbButton href="#">Main Menu</BreadcrumbButton>
          : <BreadcrumbButton href={`#${state.series}/results`}>Regatta 23</BreadcrumbButton>
        }
        {! stateIsGlobal(state.state) && 
        <>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <BreadcrumbButton>
                  {state.getTitle()}
                  <ChevronDown20Regular style={{ marginLeft: 4 }} />
                </BreadcrumbButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => window.location.hash = `#${state.series}/results`}>Results</MenuItem>
                  <MenuItem onClick={() => window.location.hash = `#${state.series}/new-race`}>New Race</MenuItem>
                  <MenuItem onClick={() => window.location.hash = `#${state.series}/competitors`}>Competitors</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </BreadcrumbItem>
        </>}
      </BreadcrumbItem>
    </Breadcrumb>
  );
}


function App() {
  const state = new State();

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <NavBar state={state} />
      <Divider style={{ flex: 0 }} />
      <div style={{ flex: "1", padding: "8px", minHeight: "0" }}>
        <StateManager state={state} />
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
