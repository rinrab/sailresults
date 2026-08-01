import { DataGridProps, Option, Button, Combobox, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Divider, FluentProvider, Input, Text, tokens, webLightTheme, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Card, CardPreview, CardHeader, Body1, CardFooter, MessageBar, MessageBarBody, MessageBarTitle, MessageBarActions, TableColumnSizingOptions, useFluent, useScrollbarWidth, Link, TableBody, TableRow, TableCell, Table, TableHeader, TableHeaderCell } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, Delete16Regular, DeleteRegular, Edit16Regular, Home24Filled, MoreHorizontalRegular, MoreVerticalRegular, New16Regular, Open16Regular, Warning16Regular } from "@fluentui/react-icons";
import React, {  Component, ErrorInfo, Fragment, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { Routes, Route, useNavigate, useParams, HashRouter } from "react-router-dom";

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

function useSeriesList() {
  return useLocalStorage<{ [key: number]: Series }>("series", () => ({}));
}

function useRacers() {
  return useLocalStorage<{ [key: number]: Racer }>("racers", () => ({}));
}

function useSeries(id: number): [Series | null, (newValue?: Series) => void] {
  const [list, setList] = useSeriesList();

  return [
    list[id],
    (value) => {
      const copy = { ...list };
      copy[id] = value;
      setList(copy);
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

function RacersList({ racers, selectedRacers, setSelectedRacers }) {
  const columns = [
    createTableColumn<Racer>({
      columnId: "name",
      renderHeaderCell: () => "Name",
      renderCell: (racer: Racer) => formatString(racer.name),
    }),
    createTableColumn<Racer>({
      columnId: "number",
      renderHeaderCell: () => "Number",
      renderCell: (racer: Racer) => formatString(racer.number),
    }),
  ];

  const onSelectionChange: DataGridProps["onSelectionChange"] = (e, data) => {
    const target = e.target as HTMLElement;
    if (! target.closest('input[type="checkbox"]')) {
      return;
    }
    setSelectedRacers(data.selectedItems);
  }

  const renderRow = ({ item, rowId }, style) => (
    <DataGridRow key={rowId} style={style}>
      {(column) =>
        <DataGridCell focusMode="group">
          {column.renderCell(item)}
        </DataGridCell>
      }
    </DataGridRow>
  );

  const { targetDocument } = useFluent();
  const scrollbarWidth = useScrollbarWidth({ targetDocument });

  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      <DataGrid
        items={Object.values(racers)}
        getRowId={racer => racer.id}
        columns={columns}
        focusMode="none"
        selectionMode="multiselect"
        selectedItems={selectedRacers}
        onSelectionChange={onSelectionChange}>
        <DataGridHeader style={{ paddingRight: scrollbarWidth }}>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>
                {renderHeaderCell()}
              </DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Racer>>
          {renderRow}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}

function EditSeries({ racers, setRacers, draft, setDraft }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const [selectedItems, setSelectedItems] = useState(() => new Set(draft.racers));
  const setSelectedRacers = (value: Set<Racer>) => {
    setSelectedItems(value);
    setDraft({
      ...draft,
      racers: [...value],
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
    setSelectedRacers(new Set([...draft.racers, id]));

    /* clear inputs */
    setName("");
    setNumber("");
  }

  return (
    <div>
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
    </div>
  );
}

function NewSeriesState() {
  const [draft, setDraft] = useLocalStorage<Series>("draft-series", () => ({
    id: nextRacerId(),
    name: "",
    racers: [],
    finishboards: [],
    draftFinishboard: null
  }));
  const navigate = useNavigate();
  const [series, setSeries] = useSeriesList();

  const done = (e) => {
    e.preventDefault();
    setSeries({ ...series, [draft.id]: draft });
    setDraft(null);
    navigate(`/series/${draft.id}/`);
  };

  return (
    <Layout>
      <NavBar>
        <NavBarItem title="New Series" to="" />
      </NavBar>
      <Content>
        <form
          onSubmit={done}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}>
          <Input placeholder="Series Name" required
                 onChange={e => setDraft({ ...draft, name: e.target.value })} />
          <div style={{ flex: 1 }} />
          <Button type="submit">Create</Button>
        </form>
      </Content>
    </Layout>
  );
}

function EditCompetitorsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [draft, setDraft] = useSeries(parseInt(seriesId));
  const [racers, setRacers] = useRacers();

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={draft.name} to=".." />
        <NavBarItem title="Competitors" to="" />
      </NavBar>
      <Content>
        <EditSeries
          racers={racers}
          setRacers={setRacers}
          draft={draft}
          setDraft={setDraft} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("..")}>Done</Button>
        </div>
      </Content>
    </Layout>
  );
}

function SeriesCard({ series }) {
  const navigate = useNavigate();

  return (
    <Card style={{
      maxWidth: "400px",
      width: "100%",
      height: "fit-content",
      marginBottom: 8}}
    >
      <Body1 as="h5" style={{ margin: 0, fontWeight: "bold" }}>
        {series.name}
      </Body1>
      <Text>{3} races / {series.racers.length} competitors</Text>

      <ResultsOverview seriesId={series.id} />
      
      <CardFooter>
        <Button appearance="primary" icon={<Open16Regular />}
                onClick={() => navigate(`/series/${series.id}/`)}>Open</Button>
      </CardFooter>
    </Card>
  );
}

function StartState() {
  const navigate = useNavigate();
  const [series, _] = useSeriesList();

  return (
    <Layout>
      <NavBar>
        <NavBarItem title="Main Menu" to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto" }}>
          <Button onClick={() => navigate(`/series/new`)}>
            Create New Series</Button>
          <Divider style={{ margin: "8px 0" }} />
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            columnGap: "16px",
            rowGap: "36px" }}>
            {Object.values(series).map((item: Series) => (
              <SeriesCard key={item.id} series={item} />
            ))}
          </div>
        </div>
      </Content>
    </Layout>
  );
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

function ResultsState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();
  const scoreboard = evaluateScoreboard(racers, series, series.finishboards);

  const columns = [
    createTableColumn({
      columnId: "rank",
      renderHeaderCell: () => "Rank",
      renderCell: (index: number) => <Text style={{ width: "100%" }} align="end">{index + 1}</Text>,
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

  const columnSizingOptions: TableColumnSizingOptions = {
    "rank": { idealWidth: 35, minWidth: 35 },
    "name": {},
    "number": {},
    "total": {},
  };

  for (let i = 0; i < scoreboard[0].scores.length; i++) {
    columns.push(createTableColumn({
      columnId: "race" + i,
      renderHeaderCell: () => (
        <div style={{ width: "100%", display: "flex" }}>
          <Text style={{ flex: "1", margin: "auto" }}>{i + 1}</Text>
          <div>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<MoreHorizontalRegular />} appearance="transparent" />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => navigate(`../races/new`)}
                            icon={<New16Regular />}>New Race</MenuItem>
                  <MenuItem onClick={() => navigate(`../races/${i}/edit`)}
                            icon={ <Edit16Regular /> }>Edit Race</MenuItem>
                  <MenuItem onClick={() => alert("dont kill me :(")}
                            icon={ <Delete16Regular /> }>Delete Race</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
      ),
      renderCell: (index: number) => <Text style={{ width: "100%" }} align="end">
        {formatRaceScore(scoreboard[index].scores[i])}
      </Text>,
    }));
    columnSizingOptions["race" + i] = { idealWidth: 40, minWidth: 40 };
  }

  columns.push(createTableColumn({
    columnId: "total",
    renderHeaderCell: () => "Total",
    renderCell: (index: number) => <Text weight="semibold">{scoreboard[index].total}</Text>
  }));

  const renderRow = ({ item, rowId }, style) => (
    <DataGridRow key={rowId} style={style}>
      {(column) => (
        <DataGridCell focusMode="group">
          {column.renderCell(item)}
        </DataGridCell>
      )}
    </DataGridRow>
  );

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.name} to=".." />
        <NavBarItem title="Results" to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto", flex: "auto" }}>
          <DataGrid
            items={scoreboard.map((_, i) => i)}
            columns={columns}
            getRowId={(item) => item}
            focusMode="none"
            resizableColumns
            resizableColumnsOptions={{
              autoFitColumns: true,
            }}
            columnSizingOptions={columnSizingOptions} >
            <DataGridHeader>
              <DataGridRow>
                {( column ) => (
                  <DataGridHeaderCell>
                    {column.renderHeaderCell()}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody>
              {renderRow}
            </DataGridBody>
          </DataGrid>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("../races/new")}>New Race</Button>
        </div>
      </Content>
    </Layout>
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

function NewRaceState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series, setSeries] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();

  const draft = series.draftFinishboard ?? [];
  const setDraft = (value) => setSeries({ ...series, draftFinishboard: value });

  const currentRacers = series.racers.map(id => racers[id]);

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.name} to="../.." />
        <NavBarItem title="Races" to=".." />
        <NavBarItem title="New Race" to="" />
      </NavBar>
      <Content>
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
                    onClick={() => navigate(`..`)}>Close</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    onClick={() => setDraft([])}>Delete Draft</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    disabled={draft.length == 0} onClick={() => {
              setSeries({
                ...series,
                draftFinishboard: null,
                finishboards: [...series.finishboards, draft]
              })
              navigate("../..");
            }}>Done</Button>
          </div>
        </div>
      </Content>
    </Layout>
  )
}

function EditRaceState() {
  const navigate = useNavigate();
  const { seriesId, raceId } = useParams();
  const [series, setSeries] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();

  const draft = series.finishboards[raceId];
  const setDraft = (value) => {
    const copy = [...series.finishboards];
    copy[raceId] = value;
    setSeries({ ...series, finishboards: copy });
  };

  const currentRacers = series.racers.map(id => racers[id]);

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.name} to="../../.." />
        <NavBarItem title="Races" to="../.." />
        <NavBarItem title={`Race ${parseInt(raceId) + 1}`} to="" />
      </NavBar>
      <Content>
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
                    disabled={draft.length == 0}
                    onClick={() => navigate("../..")}>Done</Button>
          </div>
        </div>
      </Content>
    </Layout>
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
      const columns = [
        createTableColumn<number>({
          columnId: "rank",
          renderHeaderCell: () => <Text style={{ width: "100%" }} align="end">Rank</Text>,
          renderCell: (index) => <Text style={{ width: "100%" }} align="end">{index + 1}</Text>
        }),
        createTableColumn<number>({
          columnId: "name",
          renderHeaderCell: () => "Name",
          renderCell: (index) => formatString(racers[draft[index]].name),
        }),
        createTableColumn<number>({
          columnId: "number",
          renderHeaderCell: () => "Number",
          renderCell: (index) => formatString(racers[draft[index]].number),
        }),
        createTableColumn<number>({
          columnId: "actions",
          renderHeaderCell: () => <Text style={{ width: "100%" }} align="end">Actions</Text>,
          renderCell: (index) => <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <div style={{ flex: "auto" }} />
            <Button icon={<DeleteRegular />} style={{ flex: "1" }} appearance="transparent" />
          </div>,
        }),
      ];

      const getColumnStyle = (columnId) => {
        if (columnId == "rank") {
          return { maxWidth: "40px", };
        } else if (columnId == "actions") {
          return { maxWidth: "70px", };
        } else {
          return {};
        }
      };

      const renderRow = ({ item, rowId }) => (
        <DataGridRow key={rowId}>
          {(column) => (
            <DataGridCell style={getColumnStyle(column.columnId)}>
              {column.renderCell(item)}
            </DataGridCell>
          )}
        </DataGridRow>
      );

      return (
        <div style={{ overflow: "auto", flex: "auto" }}>
          <DataGrid
            items={draft.map((_, index) => index)}
            columns={columns}
            focusMode="none">
            <DataGridHeader>
              <DataGridRow>
                {( column ) => (
                  <DataGridHeaderCell style={getColumnStyle(column.columnId)}>
                    {column.renderHeaderCell()}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Racer>>
              {renderRow}
            </DataGridBody>
          </DataGrid>
        </div>
      );
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
  { children: React.ReactNode },
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
              <MessageBarTitle>Oh no, I crashed!</MessageBarTitle>
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

function Layout({ children }) {
  return <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
    { children }
  </div>;
}

function NavBar({ children }) {
  const navigate = useNavigate();

  return <div style={{
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground4,
    display: "flex",
  }}>
    <Breadcrumb style={{ flex: 1 }}>
      <BreadcrumbItem>
        <BreadcrumbButton onClick={() => navigate("/")}>
          <Home24Filled />
        </BreadcrumbButton>
      </BreadcrumbItem>
      { children }
    </Breadcrumb>
  </div>;
}

function NavBarItem({ title, to }) {
  const navigate = useNavigate();
  return <>
    <BreadcrumbDivider />
    <BreadcrumbItem>
      <BreadcrumbButton onClick={() => navigate(to)}>{title}</BreadcrumbButton>
    </BreadcrumbItem>
  </>
}

function Content({ children }) {
  return <div style={{
    flex: "1",
    padding: "8px",
    minHeight: "0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  }}>
    { children }
  </div>
}

function EditableText({ value, setValue, rejectEmpty = false }) {
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState();
  const [revertValue, setRevertValue] = useState();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  });

  const startEdit = () => {
    setEditing(true);
    setEditingValue(value);
    setRevertValue(value);
  };

  const stopEdit = () => {
    setEditing(false);
  };

  const onChange = (e) => {
    const value = e.currentTarget.value;
    setEditingValue(value);
    if (value == "" && rejectEmpty) {
      setValue(revertValue);
    } else {
      setValue(value);
    }
  };

  if (editing) {
    return <form style={{ display: "flex", gap: 8 }}
                 onSubmit={stopEdit}>
      <Input ref={inputRef} style={{ flex: 1 }} value={editingValue}
             onBlur={stopEdit} onChange={onChange} />
      <Button onClick={() => setEditing(false)}>Done</Button>
    </form>
  } else {
    return <div>
      <Text style={{ flex: 1, marginRight: 8 }}>{value}</Text>
      <Link onClick={startEdit}>Edit</Link>
    </div>;
  }
};

function ResultsOverview({ seriesId }) {
  const [series] = useSeries(seriesId);
  const [racers] = useRacers();

  if (series.finishboards.length == 0) {
    return <div>
      <Text block>Results overview cannot be displayed.</Text>
      <Text block>There are no races yet.</Text>
    </div>
  } else {
    const scoreboard = evaluateScoreboard(racers, series, series.finishboards);

    const emojis = ["🥇", "🥈", "🥉"];

    return <div>
      <Table>
        <TableBody>
          {scoreboard.slice(-3).map((racer, index) =>
            <TableRow key={index}>
              <TableCell style={{ width: 20 }}>{emojis[index]}</TableCell>
              <TableCell>{formatString(racer.racer.number)}</TableCell>
              <TableCell>{formatString(racer.racer.name)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {scoreboard.length > 3 && <div style={{ marginTop: 8 }}>
        <Text>{scoreboard.length - 3} racers are not shown.</Text>
      </div>}
    </div>
  }
}

function SeriesOverviewState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series, setSeries] = useSeries(parseInt(seriesId));

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.name} to="" />
        <NavBarItem title="Overview" to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto" }}>
          <Text block size={700}>Series Overview</Text>
          <Divider style={{ margin: "8px 0" }} />

          <Text block size={500} style={{ margin: "8px 0" }} >Settings</Text>
          <Text weight="semibold">Name</Text>
          <EditableText rejectEmpty value={series.name}
                        setValue={value => setSeries({...series, name: value })} />

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500} style={{ margin: "8px 0" }} >Results</Text>
          <ResultsOverview seriesId={seriesId} />
          <Button onClick={() => navigate("results")} style={{ width: "200px", margin: "8px 0" }}>View Full Results</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500}>Competitors</Text>
          <Text block>{series.racers.length} people are racing in this ragatta.</Text>
          <Button onClick={() => navigate("competitors")} style={{ width: "200px", margin: "8px 0" }}>Edit Competitors</Button>

          <Divider style={{ margin: "8px 0" }} />
          <Text block size={500}>Races</Text>
          <Text block>There are {series.finishboards.length} races.</Text>
          <Button onClick={() => navigate("races")} style={{ width: "200px", margin: "8px 0" }}>Edit Races</Button>
        </div>
      </Content>
    </Layout>
  );
}

function RacesOverviewState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series] = useSeries(parseInt(seriesId));

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={ series.name } to=".." />
        <NavBarItem title="Races" to="" />
        <NavBarItem title="Overview" to="" />
      </NavBar>
      <Content>
        <div style={{ overflow: "auto", flex: 1 }}>
          <Text size={700}>Races</Text>
          <Divider style={{ margin: "8px 0" }} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell style={{ width: 70, textAlign: "right", fontWeight: "bolder" }}>Race No.</TableCell>
                <TableCell style={{ fontWeight: "bolder" }}>Racers in the finishboard</TableCell>
                <TableCell style={{ width: 25 }}></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.finishboards.map((finishboard, index) => (
                <TableRow key={index} style={{ cursor: "pointer" }}
                          onClick={() => navigate(`${index}/edit`)}>
                  <TableCell style={{ width: 70, textAlign: "right" }}>Race {index + 1}</TableCell>
                  <TableCell>{finishboard.length} / {series.racers.length}</TableCell>
                  <TableCell style={{ width: 25 }}>
                    <Menu>
                      <MenuTrigger>
                        <Button icon={<MoreVerticalRegular />} appearance="transparent"
                                onClick={(e) => e.stopPropagation()} />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuItem onClick={() => alert("oh im not implemented")}>Delete</MenuItem>
                      </MenuPopover>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }} />
          <Button onClick={() => navigate("..")}>Back</Button>
          <Button onClick={() => navigate("new")}>New Race</Button>
        </div>
      </Content>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route>
            <Route index element={<StartState />} />
            <Route path="series">
              <Route path="new" element={<NewSeriesState />} />
              <Route path=":seriesId">
                <Route index element={<SeriesOverviewState />} />
                <Route path="results" element={<ResultsState />} />
                <Route path="competitors" element={<EditCompetitorsState />} />
                <Route path="races">
                  <Route index element={<RacesOverviewState />} />
                  <Route path="new" element={<NewRaceState />} />
                  <Route path=":raceId">
                    <Route path="edit" element={<EditRaceState />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

root.render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} style={{ height: "100%" }}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
