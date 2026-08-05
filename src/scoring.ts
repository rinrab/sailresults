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
  rank: number,
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

function compareEvaluatedRacers(left: EvaluatedRacer, right: EvaluatedRacer): number {
  /* let's pretend they are the same for both left and right */
  const racesCount = left.scores.length;

  /* we don't wanna deal with that */
  if (racesCount == 0) {
    return 0;
  }

  /* handle easy out */
  if (left.total != right.total) {
    return left.total - right.total;
  }

  /* If there is a series-score tie between two or more boats, each boat’s
   * race scores shall be listed in order of best to worst, and at the first
   * point(s) where there is a difference the tie shall be broken in favour of
   * the boat(s) with the best score(s). No excluded scores shall be used.
   *
   * reference: A8.1 */
  const leftSorted = [...left.scores].sort((a, b) => a.realScore - b.realScore);
  const rightSorted = [...right.scores].sort((a, b) => a.realScore - b.realScore);

  for (let i = 0; i < racesCount; i++) {
    const diff = leftSorted[i].realScore - rightSorted[i].realScore;
    if (diff != 0) {
      return diff;
    }
  }

  /* If a tie remains between two or more boats, they shall be ranked in
   * order of their scores in the last race. Any remaining ties shall be broken
   * by using the tied boats’ scores in the next-to-last race and so on until
   * all ties are broken. These scores shall be used even if some of them are
   * excluded scores. 
   *
   * reference: A8.2 */

  return left.scores[racesCount - 1].realScore -
         right.scores[racesCount - 1].realScore;
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
      rank: 1,
    });
  }

  result.sort((a, b) => compareEvaluatedRacers(a, b));

  let rank = 1;
  for (let i = 1; i < result.length; i++) {
    const diff = compareEvaluatedRacers(result[i - 1], result[i]);
    if (diff != 0) {
      rank = i + 1;
    }
    result[i].rank = rank;
  }

  return result;
}

export function normaliseFinishboard(finishboard: Finishboard): Finishboard {
  const result = {};
  const sortedKeys = sortFinishboard(finishboard);
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
