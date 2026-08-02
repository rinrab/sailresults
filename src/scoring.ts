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
  return sorted.map(([key,]) => parseInt(key));
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
