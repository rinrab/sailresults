import { Button, Divider, Text, Menu, MenuTrigger, MenuPopover, MenuItem, TableBody, TableRow, TableCell, Table, TableHeader } from "@fluentui/react-components";
import { MoreVerticalRegular } from "@fluentui/react-icons";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Content, Layout, NavBar, NavBarItem, useSeries } from "./common";

export default function RacesOverviewState() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [series] = useSeries(parseInt(seriesId));

  const deleteClick = (e) => {
    e.stopPropagation();
    alert("oh im not implemented");
  };

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
          <Button onClick={() => navigate("..")}>Back</Button>
          <Button onClick={() => navigate("new")}>New Race</Button>
        </div>
      </Content>
    </Layout>
  );
}
