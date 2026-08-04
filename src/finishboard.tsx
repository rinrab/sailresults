import { Option, Button, Combobox, Input, Text, tokens, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, TableRow, TableCell, Table, TableHeaderCell, TableHeader, TableBody, OptionOnSelectData } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, CheckmarkRegular, MoreVerticalRegular, Warning16Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, NavBarItem, racerMatches } from "./common";
import {  Finishboard, dsqs, FinishboardEntry, sortFinishboard, Racer } from "./scoring";
import { IBoardEditor, ISeriesEditor } from "./storage";
import { StorageContext } from "./storage-context";

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
        Note: {remainingRacers.length} remaining racers will be added as DNS.
      </Text>
    </div>;
  }
}

function FinishboardRankEditor(props: {
  draft: IBoardEditor,
  editingRank: number,
  done: () => void 
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    inputRef.current?.focus();
  });
  const [editingValue, setEditingValue] = React.useState<string>(props.draft.board[props.editingRank].toString());
  const [revertValue] = React.useState(props.draft[props.editingRank]);

  const storage = React.useContext(StorageContext);
  const racer = storage.openRacer(props.editingRank);

  const setValue = (value: string) => {
    setEditingValue(value);
    const parsed = parseInt(value);
    if (! isNaN(parsed)) {
      props.draft.setPosition(props.editingRank, parsed);
    }
  }

  return <form onSubmit={props.done}>
    <Text block>Adjust position of {racer.current.name} {racer.current.number} from {revertValue}</Text>
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

function FinishboardSuggestions(props: { series: ISeriesEditor, draft: IBoardEditor, query: string }) {
  const storage = React.useContext(StorageContext);
  const remainingRacers = props.draft.getRemaining().map(id => storage.openRacer(id));
  const filteredItems = remainingRacers.filter(item => racerMatches(item.current, props.query));

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
        const text = `${item.current.name} ${item.current.number}`;
        return <Option key={item.current.id} text={text} value={item.current.id.toString()}>{text}</Option>;
      })}
    </>)
  }
}

function FinishboardRow(props: {
  rank: FinishboardEntry,
  racer: Racer,
  move: () => void,
  editing: boolean,
  setPosition: (value: FinishboardEntry | null) => void,
}) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (props.editing) {
      ref.current.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  });

  const getRowStyle = () => {
    if (props.editing) {
      return {
        backgroundColor: tokens.colorSubtleBackgroundPressed,
        color: tokens.colorNeutralForeground1Pressed,
      };
    } else {
      return {};
    }
  }

  return (
    <TableRow ref={ref} style={getRowStyle()}>
      <TableCell>{props.rank}</TableCell>
      <TableCell>{formatString(props.racer.name)}</TableCell>
      <TableCell>{formatString(props.racer.number)}</TableCell>
      <TableCell>
        <div style={{ justifyContent: "end", width: "100%", display: "flex" }}>
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
                      {Object.entries(dsqs).map(([name, desc]) =>
                        <MenuItem key={name}
                                  subText={desc}
                                  icon={ (name == props.rank) && <CheckmarkRegular /> }
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
        </div>
      </TableCell>
    </TableRow>
  );
}

function FinishboardTable(props: {
  draft: IBoardEditor,
  editingRank: number,
  setEditingRank: (value: number) => void
}) {
  const storage = React.useContext(StorageContext);

  if (Object.entries(props.draft.board).length == 0) {
    return <Text>The finishboard is empty.</Text>
  } else {
    return (
      <div style={{ overflow: "auto", flex: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell style={{ maxWidth: 40 }}>Rank</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Number</TableHeaderCell>
              <TableHeaderCell style={{ maxWidth: 40 }}></TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortFinishboard(props.draft.board).map((racerId) => {
              return <FinishboardRow 
                key={racerId}
                rank={props.draft.board[racerId]}
                racer={storage.openRacer(racerId).current} 
                setPosition={(value) => props.draft.setPosition(racerId, value)}
                move={() => props.setEditingRank(racerId)}
                editing={props.editingRank == racerId} />
              }
            )}
          </TableBody>
        </Table>
      </div>
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
      <NavBar>
        <NavBarItem title={series.current.name} to="../.." />
        <NavBarItem title="Races" to=".." />
        <NavBarItem title="New Race" to="" />
      </NavBar>
      <Content>
        <RacerPicker series={series} draft={draft} />
        <div style={{ flex: "auto", overflow: "auto" }}>
          <FinishboardTable draft={draft}
                            editingRank={editingRank}
                            setEditingRank={setEditingRank} />
        </div>
        {editingRank &&
          <FinishboardRankEditor draft={draft}
                                 editingRank={editingRank}
                                 done={() => setEditingRank(null)} />
        }
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: "1 1 300px", margin: "auto" }}>
            {<FinishBoardStatus draft={draft} />}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: "auto", width: "120px" }}
                    onClick={() => navigate(`..`)}>Close</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    onClick={() => draft.clear()}>Delete Draft</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    disabled={Object.entries(draft).length == 0}
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
  const navigate = useNavigate();
  const { seriesId, raceId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));
  const draft = series.openBoard(parseInt(raceId));
  const [editingRank, setEditingRank] = React.useState(null);

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={series.current.name} to="../../.." />
        <NavBarItem title="Races" to="../.." />
        <NavBarItem title={`R${parseInt(raceId) + 1}`} to="" />
      </NavBar>
      <Content>
        <RacerPicker series={series} draft={draft} />
        <div style={{ flex: "auto", overflow: "auto" }}>
          <FinishboardTable draft={draft}
                            editingRank={editingRank}
                            setEditingRank={setEditingRank} />
        </div>
        {editingRank &&
          <FinishboardRankEditor draft={draft}
                                 editingRank={editingRank}
                                 done={() => setEditingRank(null)} />
        }
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: "1 1 300px", margin: "auto" }}>
            {<FinishBoardStatus draft={draft} />}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: "auto", width: "120px" }}
                    disabled={Object.entries(draft.board).length == 0}
                    onClick={() => navigate("../..")}>Done</Button>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
