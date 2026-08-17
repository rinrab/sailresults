import { Option, Button, Combobox, Input, Text, tokens, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, TableRow, TableCell, Table, TableHeaderCell, TableHeader, TableBody, OptionOnSelectData } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, CheckmarkRegular, MoreVerticalRegular, Warning16Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, racerMatches } from "./common";
import { Finishboard, dsqs, FinishboardEntry, sortFinishboard, Racer, DEFAULT_DISQUALIFICATION } from "./scoring";
import { IBoardEditor, ISeriesEditor } from "./storage";
import { StorageContext } from "./storage-context";
import { Column, SailTable } from "./table";

function FinishBoardStatus(props: { draft: IBoardEditor }) {
  const remainingRacers = props.draft.getRemaining();

  if (Object.entries(props.draft.board).length == 0) {
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
        Note: {remainingRacers.length} remaining racers will be added as {DEFAULT_DISQUALIFICATION}.
      </Text>
    </div>;
  }
}

function FinishboardRankEditor(props: {
  draft: IBoardEditor,
  series: ISeriesEditor,
  editingRank: number,
  done: () => void 
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    inputRef.current?.focus();
  });
  const [editingValue, setEditingValue] = React.useState<string>(props.draft.board[props.editingRank].toString());
  const [revertValue] = React.useState(props.draft.board[props.editingRank]);

  const racer = props.series.openRacer(props.editingRank);

  const setValue = (value: string) => {
    setEditingValue(value);
    const parsed = parseInt(value);
    if (! isNaN(parsed)) {
      props.draft.setPosition(props.editingRank, parsed);
    }
  }

  return <form onSubmit={props.done}>
    <Text block>Adjust position of '{racer.current.name} {racer.current.number}' from {revertValue} to:</Text>
    <div style={{ width: "100%", display: "flex", gap: 8 }}>
      <Input ref={inputRef} style={{ flex: 1 }} type="number"
             value={editingValue} onChange={e => setValue(e.target.value)}
             min={1} max={findLastPlace(props.draft.board) - 1}
             onBlur={props.done} />
       <Button onClick={props.done} icon={<CheckmarkRegular />} />
    </div>
  </form>
}

function findLastPlace(finishboard: Finishboard) {
  let result = 1;
  for (const rank of Object.values(finishboard)) {
    if (typeof(rank) == "number" && rank + 1 > result) {
      result = rank + 1;
    }
  }
  return result;
}

function FinishboardSuggestions(props: {
  series: ISeriesEditor,
  draft: IBoardEditor,
  query: string
}) {
  const remainingRacers = props.draft.getRemaining();
  const filteredItems = remainingRacers.filter(item => racerMatches(item, props.query));

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

function FinishboardMenu(props: {
  rank: FinishboardEntry,
  racer: Racer,
  move: () => void,
  editing: boolean,
  setPosition: (value: FinishboardEntry | null) => void,
}) {
  return (
    <Menu>
      <MenuTrigger>
        <Button icon={<MoreVerticalRegular />} appearance="transparent"
          onClick={(e) => e.stopPropagation()} />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem onClick={props.move}>Move</MenuItem>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <MenuItem>Disqualify</MenuItem>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {Object.entries(dsqs).map(([name, { description }]) =>
                  <MenuItem key={name}
                    subText={description}
                    icon={(name == props.rank) && <CheckmarkRegular />}
                    onClick={() => props.setPosition(name as FinishboardEntry)}
                  >{name}</MenuItem>
                )}
              </MenuList>
            </MenuPopover>
          </Menu>
          <MenuItem onClick={() => props.setPosition(null)}>Delete</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

function maybeDeleted(str: string | null) {
  return str ?? "<racer was deleted>";
}

function FinishboardTable(props: {
  series: ISeriesEditor,
  draft: IBoardEditor,
  editingRank: number,
  setEditingRank: (value: number) => void
}) {
  const storage = React.useContext(StorageContext);

  const columns: Column<Racer>[] = [
    {
      header: "#",
      cell: (row, index) => <Text>{index + 1}</Text>,
      size: 20,
      align: "end",
    },
    {
      header: "Name",
      cell: (row) => <Text>{row?.name ?? "<racer was deleted>"}</Text>,
    },
    {
      header: "Number",
      cell: (row) => <Text>{row?.number ?? "<racer was deleted>"}</Text>,
    },
    {
      header: "Rank",
      cell: (row) => <Text>{props.draft.board[row.id]}</Text>,
      size: 20,
    },
    {
      header: "",
      cell: (row) => (
        <FinishboardMenu rank={props.draft.board[row.id]}
                         racer={row}
                         move={() => props.setEditingRank(row.id)}
                         editing={props.editingRank == row.id}
                         setPosition={(value) => props.draft.setPosition(row.id, value)} />
      ),
      size: 32,
      align: "end",
    },
  ];

  if (Object.entries(props.draft.board).length == 0) {
    return <Text>The finishboard is empty.</Text>
  } else {
    const keys = sortFinishboard(props.draft.board);
    return (
      <SailTable columns={columns}
                 keys={keys}
                 map={(key) => ({ ...props.series.openRacer(key as any)?.current, id: key })}
                 selectedIndex={keys.indexOf(props.editingRank)} />
    );
  }
}

function RacerPicker(props: { series: ISeriesEditor, draft: IBoardEditor }) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onOptionSelect = (_, data: OptionOnSelectData) => {
    if (data.optionValue) {
      const id = parseInt(data.optionValue);
      props.draft.setPosition(id, findLastPlace(props.draft.board)),
      setQuery("");
    }
  };

  return (
    <div>
      <Combobox
        ref={inputRef}
        style={{ width: "100%" }}
        placeholder="Start typing to fill the finish board in..."
        value={query}
        onInput={(e) => setQuery(e.currentTarget.value)}
        selectedOptions={[]}
        onOptionSelect={onOptionSelect}
      >
        <FinishboardSuggestions series={props.series} draft={props.draft} query={query} />
      </Combobox>
    </div>
  );
}

/* public API */
export function NewRaceState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const [editingRank, setEditingRank] = React.useState(null);

  const draft = series.openDraft();

  return (
    <Layout>
      <NavBar title={series.current.name} subtitle="New Race" />
      <Content>
        <RacerPicker series={series} draft={draft} />
        <FinishboardTable series={series}
                          draft={draft}
                          editingRank={editingRank}
                          setEditingRank={setEditingRank} />
        {editingRank &&
          <FinishboardRankEditor series={series}
                                 draft={draft}
                                 editingRank={editingRank}
                                 done={() => setEditingRank(null)} />
        }
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: "1 1 300px", margin: "auto" }}>
            {<FinishBoardStatus draft={draft} />}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: "auto", width: "120px" }}
                    onClick={() => draft.clear()}>Delete Draft</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    disabled={Object.entries(draft.board).length == 0}
                    onClick={() => {
                      series.promoteDraft();
                      navigate("..");
                    }}>Done</Button>
          </div>
        </div>
      </Content>
    </Layout>
  )
}

export function EditRaceState() {
  const { seriesId, raceId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const draft = series.openBoard(parseInt(raceId));
  const [editingRank, setEditingRank] = React.useState(null);

  React.useEffect(() => {
    for (const racer of draft.getRemaining()) {
      draft.setPosition(racer.id, DEFAULT_DISQUALIFICATION);
    }
  }, []);

  return (
    <Layout>
      <NavBar back="../.." title={series.current.name} 
              subtitle={`Race ${parseInt(raceId) + 1}`} />
      <Content>
        <RacerPicker series={series} draft={draft} />
        <FinishboardTable series={series}
                          draft={draft}
                          editingRank={editingRank}
                          setEditingRank={setEditingRank} />
        {editingRank &&
          <FinishboardRankEditor series={series}
                                 draft={draft}
                                 editingRank={editingRank}
                                 done={() => setEditingRank(null)} />
        }
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: "1 1 300px", margin: "auto" }}>
            {<FinishBoardStatus draft={draft} />}
          </div>
        </div>
      </Content>
    </Layout>
  )
}
