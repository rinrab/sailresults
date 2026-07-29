import { DataGridProps, Option, Button, Combobox, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Divider, FluentProvider, Input, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableSelectionCell, Text, tokens, webLightTheme, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Card, CardPreview, CardHeader, Body1, CardFooter, MenuButton, Checkbox, MessageBar, MessageBarBody, MessageBarTitle, MessageBarActions } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, ChevronDown20Regular, Edit16Regular, Home24Filled, Open16Regular, Warning16Regular } from "@fluentui/react-icons";
import React, {  captureOwnerStack, Component, ErrorInfo, Fragment, JSX, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

function getStoredObject<T>(key: string, createNew: () => T): T {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value) ?? createNew();
    } catch {
      return createNew();
    }
  } else {
    return createNew();
  }
}

function setStoredObject<T>(key: string, value?: T) {
  if (value) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
  }
}

function useLocalStorage<T>(key: string, createNew: () => T): [T, (newValue?: T) => void] {
  const obj = getStoredObject(key, createNew);
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
  const id = getStoredObject("globalRacerId", () => 67) + 1;
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
  finishboards: number[][];
  draftFinishboard: number[] | null;
}

function evaluateScoreboard(
  racers: { [id: number]: Racer },
  series: Series,
  finishBoards: number[][]
) {
  const result: EvaluatedRacer[] = [];
  for (const racerId of series.racers) {
    const scores: number[] = [];
    let total = 0;

    for (const board of finishBoards) {
      const index = board.findIndex(item => item == racerId); 
      if (index == -1) {
        total += series.racers.length + 1;
        scores.push(-1);
      } else {
        /* plus-one to convert from index to real score that is used for
         * further calculations */
        total += index + 1;
        scores.push(index + 1);
      }
    }

    result.push({
      racer: racers[racerId],
      scores: scores,
      total: total,
    });
  }
  return result.sort((a, b) => a.total - b.total);
}

const enum AppState {
  StartMenu ,
  NewSeries,
  RaceView,
  NewRace,
  Competitors,
}

type Route = {
  state: AppState.Competitors | AppState.RaceView | AppState.NewRace,
  series: number;
} | {
  state: AppState.StartMenu | AppState.NewSeries,
};

function parseRoute(hash: string): Route {
  const parts = hash.replace("#", "").split("/");

  if (parts.length == 1 && parts[0] == "new-series") {
    return { state: AppState.NewSeries };
  } else if (parts.length == 2) {
    const series = parseInt(parts[0]);
    if (parts[1] == "new-race") {
      return { state: AppState.NewRace, series: series };
    } else if (parts[1] == "results") {
      return { state: AppState.RaceView, series: series };
    } else if (parts[1] == "competitors") {
      return { state: AppState.Competitors, series: series };
    } else {
      return { state: AppState.RaceView, series: series };
    }
  } else {
    return { state: AppState.StartMenu };
  }
}

function serializeRoute(route: Route): string {
  if (route.state == AppState.StartMenu) {
    return "";
  } else if (route.state == AppState.NewSeries) {
    return "new-series"; 
  } else if (route.state == AppState.RaceView) {
    return `${route.series}/results`; 
  } else if (route.state == AppState.NewRace) {
    return `${route.series}/new-race`; 
  } else if (route.state == AppState.Competitors) {
    return `${route.series}/competitors`; 
  } else {
    throw "never hit";
  }
}

function useRoute() {
    const [hash, setHash] = useState(() => window.location.hash);

    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    return [
      parseRoute(hash),
      (route: Route) => {
        const hash = serializeRoute(route);
        setHash(hash);
        window.location.hash = hash;
      }];
}

function stateIsGlobal(state: AppState) {
  return state == AppState.StartMenu || state == AppState.NewSeries;
}

function getTitle(route: Route): string {
  if (route.state == AppState.StartMenu) {
    return "Main Menu";
  } else if (route.state == AppState.NewRace) {
    return "New Race";
  } else if (route.state == AppState.NewSeries) {
    return "New Series";
  } else if (route.state == AppState.Competitors) {
    return "Competitors";
  } else if (route.state == AppState.RaceView) {
    return "Results";
  }
}

function RacerRow({ racer, series, setSeries }) {
  return (
    <TableRow>
      <TableSelectionCell
        checked={series.racers.includes(racer.id)}
        onChange={e => {
        }}
      />
      <TableCell>{}</TableCell>
      <TableCell>{racer.number == "" ? "-" : racer.number}</TableCell>
    </TableRow>
  );
}

function RacersList({ racers, selectedRacers, setSelectedRacers }) {
  const columns = [
    createTableColumn<Racer>({
      columnId: "name",
      renderHeaderCell: () => "Name",
      renderCell: (racer: Racer) => racer.name == "" ? "-" : racer.name,
    }),
    createTableColumn<Racer>({
      columnId: "number",
      renderHeaderCell: () => "Number",
      renderCell: (racer: Racer) => racer.number == "" ? "-" : racer.number,
    }),
  ];

  const onSelectionChange: DataGridProps["onSelectionChange"] = (e, data) => {
    const target = e.target as HTMLElement;
    if (! target.closest('input[type="checkbox"]')) {
      return;
    }
    setSelectedRacers([...data.selectedItems]);
  }

  return (
    <div style={{ overflow: "auto", flex: "auto" }}>
      <DataGrid
        items={Object.values(racers)}
        getRowId={racer => racer.id}
        columns={columns}
        focusMode="none"
        selectionMode="multiselect"
        resizableColumns
        resizableColumnsOptions={{
          autoFitColumns: true,
        }}
        selectedItems={selectedRacers}
        onSelectionChange={onSelectionChange}>
        <DataGridHeader>
          <DataGridRow 
            selectionCell={{
              invisible: true,
              checkboxIndicator: {
                disabled: true,
              },
            }}>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>
                {renderHeaderCell()}
              </DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Racer>>
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
  );
}

function EditSeries({ racers, setRacers, draft, setDraft }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const [selectedItems, setSelectedItems] = useState(() => draft.racers);
  const setSelectedRacers = (value: Racer[]) => {
    setSelectedItems(value);
    setDraft({
      ...draft,
      racers: value
    });
  };

  const submit = () => {
    const id = nextRacerId(); 
    const newRacer: Racer = {
        id: id,
        name: name.trim(),
        number: number.trim(),
    };
    setRacers({ ...racers, [id]: newRacer });
    setSelectedRacers([...draft.racers, id]);

    /* clear inputs */
    setName("");
    setNumber("");
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
          (Object.keys(racers).length == 0)
            ? <Text>No racers added.</Text> 
            : <RacersList racers={racers}
                          selectedRacers={selectedItems}
                          setSelectedRacers={setSelectedRacers} />
        }
      </div>
    </>
  );
}

function NewSeriesState({ route, setRoute, racers, setRacers, series, setSeries }) {
  const [draft, setDraft] = useLocalStorage<Series>("draft-series", () => ({
    id: nextRacerId(),
    name: "",
    racers: [],
    finishboards: [],
    draftFinishboard: null
  }));

  const done = () => {
    setSeries({ ...series, [draft.id]: draft });
    setDraft(null);
    setRoute({ state: AppState.RaceView, series: draft.id });
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

function EditCompetitorsState({ setRoute, id, racers, setRacers, series, setSeries }) {
  const draft = series[id];
  const setDraft = (newvalue: Series) => setSeries({ ...series, [id]: newvalue });

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
        <Button onClick={() => setRoute({ state: AppState.RaceView, series: id })}>Done</Button>
      </div>
    </div>
  );
}

function SeriesCard({ series, route, setRoute }) {
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
                onClick={() => setRoute({ state: AppState.RaceView, series: series.id })}>Open</Button>
        <Button icon={<Edit16Regular />}
                onClick={() => setRoute({ state: AppState.Competitors, series: series.id })}>Edit Competitors</Button>
      </CardFooter>
    </Card>
  );
}

function StartState({ route, setRoute, series }) {
  return (
    <div style={{ gap: 8, display: "flex", flexDirection: "column" }}>
      <Button onClick={() => setRoute({ state: AppState.NewSeries })}>
        Create New Series</Button>
      <Divider />
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        columnGap: "16px",
        rowGap: "36px" }}>
        {Object.values(series).map((item: Series) => (
          <SeriesCard key={item.id} series={item} route={route} setRoute={setRoute} />
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

function RaceViewState({ route, setRoute, series, racers, finishboards }) {
  const scoreboard = evaluateScoreboard(racers, series, finishboards );

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
          items={scoreboard.map((_, i) => i)}
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
        <Button onClick={() => setRoute({ state: AppState.NewRace, series: route.series })}>New Race</Button>
      </div>
    </div>
  );
}

function racerMatches(racer: Racer, query: string) {
  return (racer.name + racer.number).toLowerCase().includes(query);
}

function FinishBoardStatus({ currentRacers, draft }) {
  const remainingRacers = currentRacers.filter(racer => ! draft.includes(racer.id));

  if (draft.length == 0) {
    return <div>
      <Warning16Regular style={{
        color: tokens.colorPaletteDarkOrangeForeground1,
        margin: "-2px 4px" }} />
      <Text>
        Please add at least one racer.
      </Text>
    </div>;
  } else if (remainingRacers.length == 0) {
    return <div>
      <CheckmarkCircle16Regular style={{
        color: tokens.colorPaletteGreenForeground1,
        margin: "-2px 4px" }} />
      <Text>
      The finish board is fine!
      </Text>
    </div>;
  } else {
    return <div>
      <Warning16Regular style={{
        color: tokens.colorPaletteDarkOrangeForeground1,
        margin: "-2px 4px" }} />
      <Text>
        Note: {remainingRacers.length} remaining racers will be added as DNS.
      </Text>
    </div>;
  }
}

function NewRaceState({ route, setRoute, racers, finishboards, setFinishboards, series }) {
  const [draft, setDraft] = useLocalStorage<number[]>("draft-finishboard", () => []);
  const currentRacers = series.racers.map(id => racers[id]);

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      gap: 8,
      height: "100%" }}>
      <div style={{ flex: "auto", overflow: "auto" }}>
        <FinishboardEditor racers={racers} currentRacers={currentRacers}
                           draft={draft} setDraft={setDraft} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: "1 1 300px", margin: "auto" }}>
          {<FinishBoardStatus currentRacers={currentRacers} draft={draft} />}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button style={{ flex: "auto", width: "120px" }}
                  onClick={() => setRoute({ state: AppState.RaceView, series: route.series })}>Close</Button>
          <Button style={{ flex: "auto", width: "120px" }}
                  onClick={() => setDraft([])}>Delete Draft</Button>
          <Button style={{ flex: "auto", width: "120px" }}
                  disabled={draft.length == 0} onClick={() => {
            setFinishboards([...finishboards, draft]);
            setDraft(null);
            setRoute({ state: AppState.RaceView, series: route.series });
          }}>Done</Button>
        </div>
      </div>
    </div>
  )
}

function FinishboardEditor({ currentRacers, racers, draft, setDraft }) {
  const [query, setQuery] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const FinishBoardSuggestions = () => {
    const remainingRacers = currentRacers.filter(racer => ! draft.includes(racer.id));
    const filteredItems = remainingRacers.filter(item => racerMatches(item, query));

    const itemStyle = {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
    };

    if (remainingRacers.length == 0) {
      return <><Text style={itemStyle}>
        The finish board is completed!</Text></>
    } else if (filteredItems.length == 0) {
      return <><Text style={itemStyle}>
        No racers matched by this query.</Text></>
    } else {
      return (<>
        {filteredItems.map(item => {
          const text = `${item.name} ${item.number}`;
          return <Option key={item.id} text={text} value={item.id.toString()}>{text}</Option>;
        })}
      </>)
    }
  }

  const FinishboardTable = () => {
    if (draft.length == 0) {
      return <Text>The finishboard is empty.</Text>
    } else {
      return <Table>
        <TableBody>
          {draft.map((item, index) => {
            const racer = racers[item];
            return <TableRow key={racer.id}>
              <TableCell style={{ width: "35px" }}>{index + 1}</TableCell>
              <TableCell>{racer.name} {racer.number}</TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
    }
  }

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      gap: 8
    }}>
      <div style={{ position: "relative" }}>
        <Combobox
          ref={inputRef}
          style={{ width: "100%", maxWidth: "100%" }} 
          placeholder="Start typing to fill the finish board in..."
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)} 
          selectedOptions={[]}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              setDraft([...draft, parseInt(data.optionValue)]);
              setQuery("");
            }
          }}
        >
          <FinishBoardSuggestions />
        </Combobox>
      </div>
      <div style={{ flex: "auto", overflow: "auto" }}>
        <FinishboardTable />
      </div>
    </div>
  )
}

class ErrorBoundary extends Component<
  { children: React.ReactNode, route: Route },
  { error?: Error, info?: ErrorInfo }
> {
  onHashChange: () => void;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(_, info: any) {
    this.setState({ info: info });
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ overflow: "auto", height: "100%" }}>
          <MessageBar intent="error" layout="multiline">
            <MessageBarBody>
              <MessageBarTitle>Oh no, I fell!</MessageBarTitle>
              <br />
              <Text>{this.state.error.toString()}</Text>
              <br />
              {this.state.info?.componentStack && 
                <Text style={{ whiteSpace: 'pre-line' }}>
                  {this.state.info.componentStack}
                </Text>}
              <br /> <br />
              {this.state.error?.stack && 
                <Text style={{ whiteSpace: 'pre-line' }}>
                  {this.state.error.stack}
                </Text>}
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <div>
                  <Button onClick={() => {
                    window.location.hash = "";
                    window.location.reload();
                  }}>Home</Button>
                </div>
              }
            />
          </MessageBar>
        </div>
      );
    } else {
      return (<Fragment>
        {this.props.children}
      </Fragment>)
    }
  }
}

function StateManager({ route, setRoute }) {
  console.log(route)
  const [racers, setRacers] =
    useLocalStorage<{ [key: number]: Racer }>("racers", () => ({}));
  const [finishboards, setFinishboards] =
    useLocalStorage<number[][]>("finishboards", () => []);
  const [series, setSeries] =
    useLocalStorage<{ [key: number]: Series }>("series", () => ({}));

  if (route.state == AppState.StartMenu) {
    return <StartState
      route={route}
      setRoute={setRoute}
      series={series}
    />
  } else if (route.state == AppState.NewSeries) {
    return <NewSeriesState 
      route={route}
      setRoute={setRoute}
      racers={racers}
      setRacers={setRacers}
      series={series}
      setSeries={setSeries}
    />
  } else if (route.state == AppState.Competitors) {
    return <EditCompetitorsState 
      setRoute={setRoute}
      id={route.series}
      racers={racers}
      setRacers={setRacers}
      series={series}
      setSeries={setSeries}
    />
  } else if (route.state == AppState.RaceView) {
    return <RaceViewState
      route={route}
      setRoute={setRoute}
      racers={racers}
      series={series[route.series]}
      finishboards={finishboards}
    />
  } else if (route.state == AppState.NewRace) {
    return <NewRaceState 
      route={route}
      setRoute={setRoute}
      racers={racers}
      finishboards={finishboards}
      setFinishboards={setFinishboards}
      series={series[route.series]}
    />
  } else {
    throw "invalid state";
  }
}

function NavBar({ route, setRoute }) {
  return (
    <Breadcrumb style={{
      padding: "4px 8px",
      backgroundColor: tokens.colorNeutralBackground4 }}>
      <BreadcrumbItem>
        <BreadcrumbButton onClick={() => setRoute({ state: AppState.StartMenu })}>
          <Home24Filled />
        </BreadcrumbButton>
      </BreadcrumbItem>
      <BreadcrumbDivider />
      {stateIsGlobal(route.state)
        ? <BreadcrumbButton onClick={() => setRoute({ state: AppState.StartMenu })}>Main Menu</BreadcrumbButton>
        : <BreadcrumbButton onClick={() => setRoute({ state: AppState.RaceView, series: route.series })}> Regatta 23</BreadcrumbButton>
      }
      {! stateIsGlobal(route.state) && 
      <>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <BreadcrumbButton>
                {getTitle(route)}
                <ChevronDown20Regular style={{ marginLeft: 4 }} />
              </BreadcrumbButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setRoute({ state: AppState.RaceView, series: route.series })}>Results</MenuItem>
                <MenuItem onClick={() => setRoute({ state: AppState.NewRace, series: route.series })}>New Race</MenuItem>
                <MenuItem onClick={() => setRoute({ state: AppState.Competitors, series: route.series })}>Competitors</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </BreadcrumbItem>
      </>}
    </Breadcrumb>
  );
}

function App() {
  const [route, setRoute] = useRoute();

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <NavBar route={route} setRoute={setRoute}  />
      <Divider style={{ flex: 0 }} />
      <div style={{ flex: "1", padding: "8px", minHeight: "0" }}>
        <ErrorBoundary>
          <StateManager route={route} setRoute={setRoute} />
        </ErrorBoundary>
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
