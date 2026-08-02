import { Button, Divider, Text, Menu, MenuTrigger, MenuPopover, MenuItem, TableBody, TableRow, TableCell, Table, TableHeader, Badge, CounterBadge } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem } from "./common";
import { useSeries } from "./storage";

export default function RacesOverviewState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series] = useSeries(parseInt(seriesId));

  const deleteClick = (e) => {
    e.stopPropagation();
    alert("oh im not implemented");
  };

  const EditDraftButton = () => {
    const style = { width: 175, };
    const click = () => navigate("new");

    if (series.draftFinishboard) {
      const count = Object.entries(series.draftFinishboard).length;
      if (count > 0) {
        return <Button onClick={() => navigate("new")}
                       icon={<CounterBadge count={count} />}
                       iconPosition="after"
                       style={style}>
          Edit Draft
        </Button>
      }
    }

    return <Button onClick={click} style={style}>New Race</Button>
  }

  return (
    <Layout>
      <NavBar>
        <NavBarItem title={ series.name } to=".." />
        <NavBarItem title="Races" to="" />
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
                  <TableCell>{Object.entries(finishboard).length} / {series.racers.length}</TableCell>
                  <TableCell style={{ width: 25 }}>
                    <Menu>
                      <MenuTrigger>
                        <Button icon={<MoreVerticalRegular />} appearance="transparent"
                                onClick={(e) => e.stopPropagation()} />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuItem onClick={deleteClick}>Delete</MenuItem>
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
    </Layout>
  );
}
