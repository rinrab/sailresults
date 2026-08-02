import { tokens, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider } from "@fluentui/react-components";
import { Home24Filled } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";

export function getStoredObject<T>(key: string, createNew: () => T): T {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value) ?? createNew();
    } catch {
      return createNew();
    }
  } else {
    return createNew();
  }
}

export function setStoredObject<T>(key: string, value?: T) {
  if (value) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
  }
}

export function useLocalStorage<T>(key: string, createNew: () => T): [T, (newValue?: T) => void] {
  const [value, setValue] = React.useState(() => getStoredObject(key, createNew));
  return [
    value,
    (newValue: T) => {
      setStoredObject(key, newValue);
      setValue(newValue);
    }
  ];
}

export function useSeriesList() {
  return useLocalStorage<{ [key: number]: Series }>("series", () => ({}));
}

export function useRacers() {
  return useLocalStorage<{ [key: number]: Racer }>("racers", () => ({}));
}

export function useSeries(id: number): [Series | null, (newValue?: Series) => void] {
  const [list, setList] = useSeriesList();

  return [
    list[id],
    (value) => {
      const copy = { ...list };
      copy[id] = value;
      setList(copy);
    }
  ];
}

export function nextRacerId() {
  const id = getStoredObject("globalRacerId", () => 67) + 1;
  setStoredObject("globalRacerId", id);
  return id;
}

export interface Racer {
  id: number;
  name: string;
  number: string;
}

export interface EvaluatedScore {
  realScore: number,
  finishboardEntry: FinishboardEntry,
};

export interface EvaluatedRacer {
  racer: Racer,
  scores: EvaluatedScore[],
  total: number,
}

export const dsqs = {
  "DNC": "Did not come",
  "DNS": "Did not start",
  "DNF": "Did not finish",
  "NSC": "Did not sail the course",
  "UFD": "Uniform flag disqualification; rule 30.3",
  "BFD": "Black flag disqualification; rule 30.4",
  "RET": "Retired",
  "DSQ": "Disqualification",
};

export type FinishboardEntry = number | "DNC" | "DNS" | "DNF" | "NSC" | "UFD" | "BFD" | "RET" | "DSQ";
export type Finishboard = { 
  [racerId: number]: FinishboardEntry
}

export interface Series {
  id: number;
  name: string;
  racers: number[];
  finishboards: Finishboard[];
  draftFinishboard: Finishboard | null;
}

export function evaluateRealScore(entry: FinishboardEntry, racersCount: number) { 
  if (typeof(entry) == "number") {
    return entry;
  } else {
    return racersCount + 1;
  }
}

export function evaluateScoreboard(
  racers: { [id: number]: Racer },
  series: Series,
  finishBoards: Finishboard[]
) {
  const result: EvaluatedRacer[] = [];
  for (const racerId of series.racers) {
    const scores: EvaluatedScore[] = [];
    let total = 0;

    for (const board of finishBoards) {
      const entry = board[racerId] ?? "DNC"; 
      const realScore = evaluateRealScore(entry, series.racers.length);

      total += realScore;
      scores.push({ 
        finishboardEntry: entry,
        realScore: realScore,
      });
    }

    result.push({
      racer: racers[racerId],
      scores: scores,
      total: total,
    });
  }
  return result.sort((a, b) => a.total - b.total);
}

export function formatString(str: string) {
  return (str == "") ? "-" : str;
}

export function racerMatches(racer: Racer, query: string) {
  return (racer.name + racer.number).toLowerCase().includes(query);
}

export function normaliseFinishboard(finishboard: Finishboard): Finishboard {
  const result = {};
  const sortedKeys = sortFinishboard(finishboard);
  console.log(sortedKeys);
  let rank = 1;

  for (const key of sortedKeys) {
    const value = finishboard[key];
    if (typeof(value) == "number") {
      result[key] = rank;
      rank++;
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function setFinishboardPosition(
  finishboard: Finishboard,
  racerId: number,
  position: FinishboardEntry | null,
) {
  let copy = { ...finishboard };
  delete copy[racerId];

  copy = normaliseFinishboard(copy);

  if (typeof(position) == "number") {
    /* kind of spaghety variation but i couldn't really care less as far is it
     * works fine */
    copy[racerId] = position - 0.5;
  } else if (position) {
    copy[racerId] = position;
  }

  return normaliseFinishboard(copy);
}

export function sortFinishboard(finishboard: Finishboard) {
  const entries = Object.entries(finishboard);
  const BIGBIGnumber = 676767;
  const sorted = entries.sort(
    ([, aValue], [, bValue]) => {
      return evaluateRealScore(aValue, BIGBIGnumber) 
           - evaluateRealScore(bValue, BIGBIGnumber);
    })
  return sorted.map(([key,]) => key);
}

export function findLastPlace(finishboard: Finishboard) {
  let result = 1;
  for (const rank of Object.values(finishboard)) {
    if (typeof(rank) == "number" && rank + 1 > result) {
      result = rank + 1;
    }
  }
  return result;
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
