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

export interface DisqualificationInfo {
  description: string,
  countsAsParticipation: boolean,
};

export const dsqs: Record<string, DisqualificationInfo> = {
  "DNC": {
    description: "Did not come",
    countsAsParticipation: false,
  },
  "DNS": {
    description: "Did not start",
    countsAsParticipation: false,
  },
  "OCS": {
    description: "On course side; rule 30.1",
    countsAsParticipation: true,
  },
  "DNF": {
    description: "Did not finish",
    countsAsParticipation: true,
  },
  "NSC": {
    description: "Did not sail the course",
    countsAsParticipation: true,
  },
  "UFD": {
    description: "Uniform flag disqualification; rule 30.3",
    countsAsParticipation: true,
  },
  "BFD": {
    description: "Black flag disqualification; rule 30.4",
    countsAsParticipation: true,
  },
  "RET": {
    description: "Retired",
    countsAsParticipation: true,
  },
  "DSQ": {
    description: "Disqualification",
    countsAsParticipation: true,
  },
};

export type FinishboardEntry = number | "DNC" | "DNS" | "DNF" | "NSC" | "UFD" | "BFD" | "RET" | "DSQ";
export type Finishboard = { 
  [racerId: number]: FinishboardEntry
}

export const DEFAULT_DISQUALIFICATION: FinishboardEntry = "DNF";

export interface Series {
  id: number;
  name: string;
  racers: Racer[];
  finishboards: Finishboard[];
  draftFinishboard: Finishboard | null;
  lastEditedTime: string;
}

export function evaluateRealScore(entry: FinishboardEntry, racersCount: number) { 
  if (typeof(entry) == "number") {
    return entry;
  } else {
    return racersCount + 1;
  }
}

function compareEvaluatedRacers(left: EvaluatedRacer, right: EvaluatedRacer): number {
  if (left.rank == -1 && right.rank == -1) {
    return 0;
  } else if (left.rank == -1) {
    return 67;
  } else if (right.rank == -1) {
    return -67;
  }

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
  for (let i = racesCount - 1; i >= 0; i--) {
    const diff = left.scores[i].realScore -
                 right.scores[i].realScore;
    if (diff != 0) {
      return diff;
    }
  }

  return 0;
}

function countsAsParticipation(scores: EvaluatedScore[]): boolean {
  for (const score of scores) {
    if (typeof(score.finishboardEntry) == "number") {
      return true;
    } else {
      if (dsqs[score.finishboardEntry].countsAsParticipation) {
        return true;
      }
    }
  }
  return false;
}

export function evaluateScoreboard(
  series: Series,
  finishBoards: Finishboard[]
) {
  const result: EvaluatedRacer[] = [];
  for (const racer of series.racers) {
    const scores: EvaluatedScore[] = [];
    let total = 0;

    for (const board of finishBoards) {
      const entry = board[racer.id] ?? DEFAULT_DISQUALIFICATION; 
      const realScore = evaluateRealScore(entry, series.racers.length);

      total += realScore;
      scores.push({ 
        finishboardEntry: entry,
        realScore: realScore,
      });
    }

    result.push({
      racer: racer,
      scores: scores,
      total: total,
      rank: 1,
    });
  }

  /* mark all not-participated entries */
  for (const racer of result) {
    if (! countsAsParticipation(racer.scores)) {
      racer.rank = -1;
    } else {
      racer.rank = 1;
    }
  }

  result.sort((a, b) => compareEvaluatedRacers(a, b));

  let rank = 1;
  for (let i = 1; i < result.length; i++) {
    if (result[i].rank != -1) {
      const diff = compareEvaluatedRacers(result[i - 1], result[i]);
      if (diff != 0) {
        rank = i + 1;
      }
      result[i].rank = rank;
    }
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
