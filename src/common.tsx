import { tokens, TabList, Tab, Text, Button } from "@fluentui/react-components";
import { Flag20Regular, Home20Regular, People20Regular, Settings20Regular, Trophy20Regular, ChevronLeftRegular, ChevronLeft20Regular, ChevronLeft24Regular, ChevronLeft28Regular, ChevronLeft32Regular } from "@fluentui/react-icons";
import React from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { Racer } from "./scoring";
import { AccountMenu } from "./account";

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

export function NavBar({ title, subtitle = undefined, back = ".." }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    window.document.title = `${title} - SailResults`;
  });

  return <div style={{
    padding: 4,
    backgroundColor: tokens.colorNeutralBackground4,
    display: "flex",
  }} className="screen-only">
    {back && 
      <Button icon={<ChevronLeftRegular /> }
              size="large"
              onClick={() => navigate(back)}
              appearance="transparent" />
    }
    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
      <Text weight="bold" size={200}>
        {title}
      </Text>
      {subtitle && <Text size={200}>
        {subtitle}
      </Text>}
    </div>
    <div style={{ marginRight: 8 }}>
      <AccountMenu />
    </div>
  </div>;
}

export function SeriesNavigation() {
  const navigate = useNavigate();
  const { seriesId, page } = useMatch("/series/:seriesId/:page?/*").params;

  return <TabList style={{ 
                    backgroundColor: tokens.colorNeutralBackground4,
                    display: "flex",
                    justifyContent: "center"
                  }}
                  className="screen-only"
                  onTabSelect={(_, data) => navigate(`/series/${seriesId}/${data.value ?? ""}`)}
                  selectedValue={page}>
    <div style={{ display: "flex", flex: 1, justifyContent: "space-around", maxWidth: 400 }}>
      <Tab value={undefined}>
        <Home20Regular />
        <Text block size={100}>Overview</Text>
      </Tab>
      <Tab value="competitors">
        <People20Regular />
        <Text block size={100}>Competitors</Text>
      </Tab>
      <Tab value="races">
        <Flag20Regular />
        <Text block size={100}>Races</Text>
      </Tab>
      <Tab value="results">
        <Trophy20Regular />
        <Text block size={100}>Results</Text>
      </Tab>
      <Tab value="config">
        <Settings20Regular />
        <Text block size={100}>Settings</Text>
      </Tab>
    </div>
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
