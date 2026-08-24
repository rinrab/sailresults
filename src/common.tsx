import { tokens, TabList, Tab, Text, Button, Spinner } from "@fluentui/react-components";
import { Flag20Regular, Home20Regular, People20Regular, Settings20Regular, Trophy20Regular, ChevronLeftRegular, ChevronLeft20Regular, ChevronLeft24Regular, ChevronLeft28Regular, ChevronLeft32Regular, CheckmarkCircle16Regular, CloudOff16Regular, Warning16Regular } from "@fluentui/react-icons";
import React from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { AccountMenu } from "./account";
import { StorageContext } from "./storage-context";
import { FirebaseAuthContext } from "./storage-firebase-auth-context";
import { Racer, Series } from "./storage";

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

export function NavBarBase({ children }) {
  return <div style={{
    padding: 8,
    backgroundColor: tokens.colorNeutralBackground4,
    display: "flex",
    alignItems: "stretch",
    height: 38,
  }} className="screen-only">
    {children}
  </div>
}

export function NavBar({ title, subtitle = undefined, back = ".." }) {
  const navigate = useNavigate();
  const storage = React.useContext(StorageContext);
  const match = useMatch("/series/:seriesId/*");
  const seriesId = parseInt(match?.params?.seriesId);
  const series = isNaN(seriesId) ? null : storage.openSeries(seriesId).current;

  React.useEffect(() => {
    window.document.title = `${title} - SailResults`;
  });

  return <NavBarBase>
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
    <div style={{ marginRight: 8, display: "flex", gap: 8, alignItems: "center" }}>
      {series && <SeriesStatus series={series} />}
      <AccountMenu />
    </div>
  </NavBarBase>;
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

export function SeriesStatus(props: { series: Series }) {
  const { isReady, user } = React.useContext(FirebaseAuthContext);

  if (!isReady) {
    return <Spinner size="extra-tiny" label="Loading Status..." />
  } else if (user) {
    if (props.series.scheduleForDelete) {
      return <Spinner size="extra-tiny" label="Deleting..." />
    } else if (props.series.needsSync) {
      return <Spinner size="extra-tiny" label="Syncing..." />
    } else if (props.series.remoteModified) {
      return <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <CheckmarkCircle16Regular color={tokens.colorPaletteGreenBackground3} />
        <Text>Fetched</Text>
      </div>
    } else if (props.series.firebaseId) {
      return <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <CheckmarkCircle16Regular color={tokens.colorPaletteGreenBackground3} />
        <Text>Up to date</Text>
      </div>
    }
  } else {
    if (props.series.needsSync && props.series.firebaseId) {
      return <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Warning16Regular color={tokens.colorPaletteRedBackground3} />
        <Text>Local modification were not synced</Text>
      </div>
    } else {
      return <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <CloudOff16Regular />
        <Text>Offline</Text>
      </div>
    }
  }
}
