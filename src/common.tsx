import { tokens, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider, TabList, Tab, Text } from "@fluentui/react-components";
import { Flag20Regular, FlagRegular, Home20Regular, Home24Filled, Home24Regular, HomeRegular, People20Regular, PeopleRegular, Settings20Regular, SettingsRegular, Trophy20Regular, Trophy24Regular, TrophyRegular } from "@fluentui/react-icons";
import React from "react";
import { useLocation, useMatch, useMatches, useNavigate, useParams } from "react-router-dom";
import { Racer } from "./scoring";

export function formatString(str: string) {
  return (str == "") ? "-" : str;
}

export function racerMatches(racer: Racer, query: string) {
  return (racer.name + racer.number).toLowerCase().includes(query);
}

export function Layout({ children, print = undefined }) {
  return <div className="layout">
    {children}
    {print && <div className="print-only">{print}</div>}
  </div>;
}

export function NavBar({ children }) {
  const navigate = useNavigate();

  return <div style={{
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground4,
    display: "flex",
  }} className="screen-only">
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

export function NavBarItem({ title, to }) {
  const navigate = useNavigate();
  return <>
    <BreadcrumbDivider />
    <BreadcrumbItem>
      <BreadcrumbButton onClick={() => navigate(to)}>{title}</BreadcrumbButton>
    </BreadcrumbItem>
  </>
}

export function SeriesNavigation() {
  const navigate = useNavigate();
  const { seriesId, page } = useMatch("/series/:seriesId/:page?/*").params;

  return <TabList style={{ 
                    backgroundColor: tokens.colorNeutralBackground4,
                    display: "flex",
                    justifyContent: "space-around",
                  }}
                  onTabSelect={(_, data) => navigate(`/series/${seriesId}/${data.value ?? ""}`)}
                  selectedValue={page}>
    <Tab value={undefined}>
      <Home20Regular />
      <Text block size={100}>Overview</Text>
    </Tab>
    <Tab value="results">
      <Trophy20Regular />
      <Text block size={100}>Results</Text>
    </Tab>
    <Tab value="races">
      <Flag20Regular />
      <Text block size={100}>Races</Text>
    </Tab>
    <Tab value="competitors">
      <People20Regular />
      <Text block size={100}>Competitors</Text>
    </Tab>
    <Tab value="config">
      <Settings20Regular />
      <Text block size={100}>Settings</Text>
    </Tab>
  </TabList>
}

export function Content({ children, screenOnly = false }) {
  return <div
    className={screenOnly ? "screen-only" : ""}
    style={{
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
