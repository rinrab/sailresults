import { Button, Text, Menu, MenuTrigger, MenuPopover, MenuItem, CounterBadge } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, SeriesNavigation } from "./common";
import { StorageContext } from "./storage-context";
import { Column, SailTable } from "./table";
import { Finishboard } from "./storage";

export default function RacesOverviewState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const storage = React.useContext(StorageContext);
  const series = storage.openSeries(parseInt(seriesId));

  const EditDraftButton = () => {
    const style = { width: 175, };
    const click = () => navigate("new");

    const draft = series.openDraft();

    const count = Object.entries(draft.board).length;
    if (count > 0) {
      return <Button onClick={() => navigate("new")}
                     icon={<CounterBadge count={count} />}
                     iconPosition="after"
                     style={style}>
        Edit Draft
      </Button>
    }

    return <Button onClick={click} style={style}>New Race</Button>
  }

  const getFinishedRacers = (board: Finishboard) => { 
    let result = 0;
    for (const [_, entry] of Object.entries(board)) {
      if (typeof(entry) == "number") {
        result++;
      }
    }
    return result;
  };

  const columns: Column<Finishboard>[] = [
    {
      header: "#",
      cell: (_, index) => <Text>R{index + 1}</Text>,
      align: "end",
      size: 40,
    },
    {
      header: "Racers finished",
      cell: (row) => <Text>{getFinishedRacers(row)} / {series.current.racers.length}</Text>,
      minsize: 70,
    },
    {
      header: "",
      cell: (_, index) => <Menu>
        <MenuTrigger>
          <Button icon={<MoreVerticalRegular />} appearance="transparent"
                  onClick={(e) => e.stopPropagation()} />
        </MenuTrigger>
        <MenuPopover>
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            series.deleteBoard(index);
          }}>Delete</MenuItem>
        </MenuPopover>
      </Menu>,
      size: 32,
      align: "end",
    }
  ];

  return (
    <Layout>
      <NavBar title={series.current.name} subtitle="Races" />
      <Content>
        <SailTable data={series.current.finishboards}
                   columns={columns}
                   onSelect={(value, index) => navigate(`${index}/edit`)} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }} />
          <EditDraftButton />
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
