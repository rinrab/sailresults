import { Button, Divider, Text, Menu, MenuTrigger, MenuPopover, MenuItem, TableBody, TableRow, TableCell, Table, TableHeader, Badge, CounterBadge } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, SeriesNavigation } from "./common";
import { StorageContext } from "./storage-context";

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

  return (
    <Layout>
      <NavBar title={series.current.name} subtitle="Races" />
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
              {series.current.finishboards.map((finishboard, index) => (
                <TableRow key={index} style={{ cursor: "pointer" }}
                          onClick={() => navigate(`${index}/edit`)}>
                  <TableCell style={{ width: 70, textAlign: "right" }}>R{index + 1}</TableCell>
                  <TableCell>{Object.entries(finishboard).length} / {series.current.racers.length}</TableCell>
                  <TableCell style={{ width: 25 }}>
                    <Menu>
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
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }} />
          <EditDraftButton />
        </div>
      </Content>
      <SeriesNavigation />
    </Layout>
  );
}
