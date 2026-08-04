import React from "react";
import { Finishboard, FinishboardEntry, normaliseFinishboard, Racer, Series, setFinishboardPosition } from "./scoring";

export interface IStorage {
  listSeries: () => SeriesCollection,
  listRacers: () => RacersCollection,

  newSeries: (name: string) => number;
  openSeries: (id: number) => ISeriesEditor;

  nextGlobalId: () => number;

  openRacer: (id: number) => IRacerEditor;
  newRacer: () => number;
}

export interface ISeriesEditor {
  current: Series,

  setName: (name: string) => void,

  addRacer: (id: number) => void,
  removeRacer: (id: number) => void,

  openBoard: (index: number) => IBoardEditor,
  deleteBoard: (index) => void,

  openDraft: () => IBoardEditor,
  promoteDraft: () => void,
}

export interface IBoardEditor {
  board: Finishboard,
  setPosition: (racerId: number, position: FinishboardEntry | null) => void,
  getRemaining: () => number[],
  clear: () => void,
}

export interface IRacerEditor {
  current: Racer,
  setName: (name: string) => void;
  setNumber: (number: string) => void;
  kill: () => void;
}

export interface PackedSeries {
  name: string;
  racers: { name: string, number: string }[];
  finishboards: FinishboardEntry[][];
};

type Mutator<T> = (mutate: (old: T) => T) => void;

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

type RacersCollection = { [id: number]: Racer };
type SeriesCollection = { [id: number]: Series };

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

export function openRacers(): RacersCollection {
  const stored = ensureObject(openKey(RACERS_KEY) ?? {});
  const result: RacersCollection = {};

  for (const [key, value] of Object.entries(stored)) {
    result[key] = {
      id: ensureNumber(parseInt(key)),
      name: ensureString(value["name"]),
      number: ensureString(value["number"]),
    };
  }

  return result;
}

export function saveRacers(racers: RacersCollection) {
  const obj = {};

  for (const value of Object.values(racers)) {
    obj[value.id] = {
      name: value.name,
      number: value.number,
    };
  }
  saveKey(RACERS_KEY, obj);
}

function openFinishboard(value: any) {
  const board = ensureObject(value);
  const result: { [racer: number]: FinishboardEntry } = [];
  for (const [racer, entry] of Object.entries(board)) {
    if (typeof(entry) == "number" || typeof(entry) == "string") {
      result[parseInt(racer)] = entry as FinishboardEntry;
    } else {
      throw new Error("bad entry found");
    }
  }
  return board;
}

export function openSeries(): SeriesCollection {
  const stored = ensureObject(openKey(SERIES_KEY) ?? {});
  const result: SeriesCollection = {};

  for (const [key, value] of Object.entries(stored)) {
    const finishboards = ensureArray(value.finishboards)
      .map(board => openFinishboard(board));
      
    const draft = value.draftFinishboard
      ? openFinishboard(value.draftFinishboard) 
      : null;

    const racers = ensureArray(value.racers).map(racer  => ensureNumber(racer));

    result[key] = {
      id: ensureNumber(parseInt(key)),
      name: ensureString(value.name),
      racers: racers,
      finishboards: finishboards,
      draftFinishboard: draft,
    };
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
    };
  }
  saveKey(SERIES_KEY, result);
}


function getBoardEditor(
  series: Series,
  board: Finishboard,
  update: Mutator<Finishboard>,
): IBoardEditor {
  return {
    board: board,

    setPosition: (racerId, posistion) => update(old => {
      return setFinishboardPosition(old, racerId, posistion);
    }),

    getRemaining: () => series.racers.filter(racer => ! board[racer]),

    clear: () => update(() => ({})),
  };
};

function getSeriesEditor(
  series: Series,
  update: Mutator<Series>
): ISeriesEditor {
  return {
    current: series,

    setName: (name) => update(old => ({
      ...old,
      name: name
    })),

    addRacer: (id) => update(old => ({
      ...old,
      racers: [...old.racers, id]
    })),

    removeRacer: (id) => update(old => ({
      ...old,
      racers: old.racers.filter((item) => item != id),
    })),

    openBoard: (index) => getBoardEditor(
      series,
      series.finishboards[index],
      (mutate) => update(old => {
        const copy = [...old.finishboards];
        copy[index] = mutate(copy[index]);
        return {
          ...old,
          finishboards: copy
        }
      })
    ),

    deleteBoard: (index) => {
      series.finishboards = series.finishboards.filter((_, i) => i != index);
    },

    promoteDraft: () => update(old => ({
      ...old,
      finishboards: [...old.finishboards, old.draftFinishboard],
      draftFinishboard: null,
    })),

    openDraft: () => getBoardEditor(
      series,
      series.draftFinishboard ?? {},
      (mutate) => update(old => ({
          ...old,
          draftFinishboard: mutate(old.draftFinishboard),
      })),
    ),
  };
}

function getRacerEditor(racer: Racer, update: Mutator<Racer>): IRacerEditor {
  return {
    current: racer,
    setName: (name) => update(old => ({
      ...old,
      name: name,
    })),
    setNumber: (number) => update(old => ({
      ...old,
      number: number,
    })),
    kill: () => "",
  };
}

function nextGlobalId() {
  const id = openKey(GLOBAL_ID_KEY) ?? 67;
  saveKey(GLOBAL_ID_KEY, id + 1);
  return id;
}

export function getStorageEditor(
  getRacers: () => RacersCollection,
  updateRacers: Mutator<RacersCollection>,
  getSeries: () => SeriesCollection,
  updateSeries: Mutator<SeriesCollection>,
): IStorage {
  return {
    listSeries: () => getSeries(),
    listRacers: () => getRacers(),

    newSeries: (name) => {
      const id = nextGlobalId();
      updateSeries((old) => ({
        ...old,
        [id]: {
          id: id,
          name: name,
          racers: [],
          finishboards: [],
          draftFinishboard: null,
        }
      }));
      return id;
    },

    openSeries: (id): ISeriesEditor => {
      const openedSeries = getSeries()[id];

      if (openedSeries) {
        return getSeriesEditor(
          openedSeries,
          (mutate) => updateSeries((old) => {
            const copy = { ...old };
            copy[id] = mutate(copy[id]);
            return copy;
          }
        ));
      } else {
        throw new Error("series does not exist");
      }
    },

    newRacer: () => {
      const id = nextGlobalId();
      updateRacers((old) => ({
        ...old,
        [id]: {
          id: id,
          name: "",
          number: "",
        }
      }));
      return id;
    },

    openRacer: (id) => {
      return getRacerEditor(
        getRacers()[id],
        (mutate) => updateRacers((old) => {
          const copy = { ...old };
          copy[id] = mutate(copy[id]);
          return copy;
        }),
      )
    },

    nextGlobalId: nextGlobalId,
  };
}

export function importSeries(storage: IStorage, pack: PackedSeries) {
  console.log("before")
  const seriesId = storage.newSeries(pack.name);
  console.log("after")
  const series = storage.openSeries(seriesId);

  let firstId: number;
  for (const packedRacer of pack.racers) {
    const id = storage.newRacer();
    if (!firstId) {
      firstId = id;
    }
    const racer = storage.openRacer(id);
    racer.setName(packedRacer.name);
    racer.setNumber(packedRacer.number);
    series.addRacer(id);
  }

  for (const packedBoard of pack.finishboards) {
    const draft = series.openDraft();
    for (let i = 0; i < packedBoard.length; i++) {
      draft.setPosition(firstId + i, packedBoard[i]);
    }
    series.promoteDraft();
  }

  return seriesId;
}
