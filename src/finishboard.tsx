import { Option, Button, Combobox, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Input, Text, tokens, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, CheckmarkRegular, DismissRegular, MoreVerticalRegular, Warning16Regular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, formatString, Layout, NavBar, NavBarItem, racerMatches } from "./common";
import { setFinishboardPosition, Finishboard, dsqs, FinishboardEntry, sortFinishboard, Racer } from "./scoring";
import { useSeries, useRacers } from "./storage";

function FinishBoardStatus({ currentRacers, draft }) {
  const remainingRacers = currentRacers.filter(racer => ! draft[racer.id]);

  if (Object.entries(draft).length == 0) {
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

function FinishboardRankEditor({ racers, draft, setDraft, editingRank, setEditingRank }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    inputRef.current?.focus();
  });
  const [editingValue, setEditingValue] = React.useState(draft[editingRank]);
  const [revertValue] = React.useState(draft[editingRank]);

  const setValue = (value) => {
    setEditingValue(value);
    const parsed = parseInt(value);
    if (! isNaN(parsed)) {
      setDraft(setFinishboardPosition(draft, editingRank, parsed));
    }
  }

  const done = () => {
    setEditingRank(null);
  };
  const cancel = () => {
    setEditingRank(null);
    setDraft(setFinishboardPosition(draft, editingRank, revertValue));
  };

  return <form onSubmit={done}>
    <Text block>Adjust position of {racers[editingRank].name} {racers[editingRank].number} from {revertValue}</Text>
    <div style={{ width: "100%", display: "flex", gap: 8 }}>
      <Input ref={inputRef} style={{ flex: 1 }} type="number"
             value={editingValue} onChange={e => setValue(e.target.value)}
             min={1} max={findLastPlace(draft) - 1}
             onBlur={cancel} />
       <Button onClick={done} icon={<CheckmarkRegular />} />
       <Button onClick={cancel} icon={<DismissRegular />} />
    </div>
  </form>
}

export function NewRaceState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series, setSeries] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();
  const [editingRank, setEditingRank] = React.useState(null);

  const draft = series.draftFinishboard ?? {};
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
                             draft={draft} setDraft={setDraft}
                             editingRank={editingRank} setEditingRank={setEditingRank} />
        </div>
        {editingRank &&
          <FinishboardRankEditor racers={racers} draft={draft} setDraft={setDraft}
                                 editingRank={editingRank} setEditingRank={setEditingRank} />
        }
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: "1 1 300px", margin: "auto" }}>
            {<FinishBoardStatus currentRacers={currentRacers} draft={draft} />}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: "auto", width: "120px" }}
                    onClick={() => navigate(`..`)}>Close</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    onClick={() => setDraft({})}>Delete Draft</Button>
            <Button style={{ flex: "auto", width: "120px" }}
                    disabled={Object.entries(draft).length == 0} onClick={() => {
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

export function EditRaceState() {
  const navigate = useNavigate();
  const { seriesId, raceId } = useParams();
  const [series, setSeries] = useSeries(parseInt(seriesId));
  const [racers] = useRacers();
  const [editingRank, setEditingRank] = React.useState(null);

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
                             draft={draft} setDraft={setDraft}
                             editingRank={editingRank} setEditingRank={setEditingRank} />
        </div>
        {editingRank &&
          <FinishboardRankEditor racers={racers} draft={draft} setDraft={setDraft}
                                 editingRank={editingRank} setEditingRank={setEditingRank} />
        }
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

function findLastPlace(finishboard: Finishboard) {
  let result = 1;
  for (const rank of Object.values(finishboard)) {
    if (typeof(rank) == "number" && rank + 1 > result) {
      result = rank + 1;
    }
  }
  return result;
}

function FinishboardSuggestions({ draft, currentRacers, query }) {
  const remainingRacers = currentRacers.filter(racer => ! draft[racer.id]);
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

function FinishboardTable({ racers, draft, setDraft, editingRank, setEditingRank }) {
  const editingRowRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    editingRowRef.current?.scrollIntoView();
  });

  if (Object.entries(draft).length == 0) {
    return <Text>The finishboard is empty.</Text>
  } else {
    const columns = [
      createTableColumn<number>({
        columnId: "rank",
        renderHeaderCell: () => <Text style={{ width: "100%" }} align="end">Rank</Text>,
        renderCell: (racerId) => <Text style={{ width: "100%" }} align="end">{draft[racerId]}</Text>
      }),
      createTableColumn<number>({
        columnId: "name",
        renderHeaderCell: () => "Name",
        renderCell: (racerId) => formatString(racers[racerId].name),
      }),
      createTableColumn<number>({
        columnId: "number",
        renderHeaderCell: () => "Number",
        renderCell: (racerId) => formatString(racers[racerId].number),
      }),
      createTableColumn<number>({
        columnId: "actions",
        renderHeaderCell: () => <Text style={{ width: "100%" }} align="end">Actions</Text>,
        renderCell: (racerId) =>
          <div style={{ justifyContent: "end", width: "100%", display: "flex" }}>
            <Menu>
              <MenuTrigger>
                <Button icon={<MoreVerticalRegular />} appearance="transparent"
                        onClick={(e) => e.stopPropagation()} />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setEditingRank(racerId)}>Move</MenuItem>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <MenuItem onClick={(e) => e.stopPropagation()}>Disqualify</MenuItem>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        {Object.entries(dsqs).map(([name, desc]) =>
                          <MenuItem key={name}
                                    subText={desc}
                                    icon={ (name == draft[racerId]) && <CheckmarkRegular /> }
                                    onClick={() => setDraft(setFinishboardPosition(draft, racerId, name as FinishboardEntry))}
                            >{name}</MenuItem>
                        )}
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                  <MenuItem onClick={() => setDraft(setFinishboardPosition(draft, racerId, null))}>Delete</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
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

    const getRowStyle = (id) => {
      if (id == editingRank) {
        return {
          backgroundColor: tokens.colorSubtleBackgroundPressed,
          color: tokens.colorNeutralForeground1Pressed,
        };
      } else {
        return {};
      }
    }

    return (
      <div style={{ overflow: "auto", flex: "auto" }}>
        <DataGrid
          items={sortFinishboard(draft)}
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
            {({ item, rowId }) => (
              <DataGridRow key={rowId} style={getRowStyle(item)} ref={(item == editingRank) && editingRowRef}>
                {(column) => (
                  <DataGridCell style={getColumnStyle(column.columnId)}>
                    {column.renderCell(item)}
                  </DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>
    );
  }
}

function FinishboardEditor({ currentRacers, racers, draft, setDraft, editingRank, setEditingRank }) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      gap: 8
    }}>
      <div>
        <Combobox
          ref={inputRef}
          style={{ width: "100%", maxWidth: "100%" }} 
          placeholder="Start typing to fill the finish board in..."
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)} 
          selectedOptions={[]}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              const id = parseInt(data.optionValue);
              setDraft({
                ...draft,
                [id]: findLastPlace(draft),
              });
              setQuery("");
            }
          }}
        >
          <FinishboardSuggestions draft={draft} query={query} currentRacers={currentRacers} />
        </Combobox>
      </div>
      <div style={{ flex: "auto" }}>
        <FinishboardTable racers={racers} draft={draft} setDraft={setDraft}
                          editingRank={editingRank} setEditingRank={setEditingRank} />
      </div>
    </div>
  )
}
