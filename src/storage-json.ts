import { Finishboard, FinishboardEntry, getCurrentTime, Racer, Series, SeriesCollection } from "./storage";

function openKey(key: string) {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  } else {
    return undefined;
  }
}

function saveKey(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

const RACERS_KEY = "racers";
const SERIES_KEY = "series";
const GLOBAL_ID_KEY = "globalRacerId";

type LegacyRacersCollection = { [id: number]: Racer };

function ensureNumber(value: any): number {
  if (typeof(value) == "number") {
    return value;
  } else {
    throw new Error("value must be a number");
  }
}

function ensureString(value: any): string {
  if (typeof(value) == "string") {
    return value;
  } else {
    throw new Error("value must be a string");
  }
}

function ensureObject(value: any): Object {
  if (typeof(value) == "object") {
    return value;
  } else {
    throw new Error("value must be an object");
  }
}

function ensureArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  } else {
    throw new Error("value must be an array");
  }
}

export function openLegacyRacers(): LegacyRacersCollection {
  const stored = ensureObject(openKey(RACERS_KEY) ?? {});
  const result: LegacyRacersCollection = {};

  for (const [key, value] of Object.entries(stored)) {
    result[key] = {
      id: ensureNumber(parseInt(key)),
      name: ensureString(value["name"]),
      number: ensureString(value["number"]),
    };
  }

  return result;
}

function openFinishboard(value: any): Finishboard {
  const board = ensureObject(value);
  const result: { [racer: number]: FinishboardEntry } = [];
  for (const [racer, entry] of Object.entries(board)) {
    if (typeof(entry) == "number" || typeof(entry) == "string") {
      result[parseInt(racer)] = entry as FinishboardEntry;
    } else {
      throw new Error("bad entry found");
    }
  }
  return board as Finishboard;
}

function openSeriesRacers(
  value: any,
  legacyRacers: LegacyRacersCollection
): Racer[] {
  return ensureArray(value).map((racer) => {
    if (typeof(racer) == "number") {
      return legacyRacers[racer];
    } else {
      const obj = ensureObject(racer);
      return {
        id: ensureNumber(obj["id"]),
        name: ensureString(obj["name"]),
        number: ensureString(obj["number"]),
      };
    }
  });
}

export function openSeries(legacyRacers: LegacyRacersCollection): SeriesCollection {
  const stored = ensureObject(openKey(SERIES_KEY) ?? {});
  const result: SeriesCollection = {};

  for (const [key, value] of Object.entries(stored)) {
    const finishboards = ensureArray(value.finishboards)
      .filter(board => !! board).map(board => openFinishboard(board));
      
    const draft = value.draftFinishboard
      ? openFinishboard(value.draftFinishboard) 
      : null;

    result[key] = {
      id: ensureNumber(parseInt(key)),
      name: ensureString(value.name),
      racers: openSeriesRacers(value.racers, legacyRacers),
      finishboards: finishboards,
      draftFinishboard: draft,
      lastEditedTime: ensureString(value.lastEditedTime ?? getCurrentTime()),
      firebaseId: value.firebaseId,
      needsSync: !! value.needsSync,
      remoteModified: false,
    } satisfies Series;
  }

  return result;
}

export function saveSeries(series: SeriesCollection) {
  const result = {};
  for (const value of Object.values(series)) {
    result[value.id] = {
      name: value.name,
      racers: value.racers,
      finishboards: value.finishboards,
      draftFinishboard: value.draftFinishboard,
      lastEditedTime: value.lastEditedTime,
      firebaseId: value.firebaseId,
      needsSync: value.needsSync,
    };
  }
  saveKey(SERIES_KEY, result);
}

export function nextGlobalId() {
  const id = openKey(GLOBAL_ID_KEY) ?? 67;
  saveKey(GLOBAL_ID_KEY, id + 1);
  return id;
}
