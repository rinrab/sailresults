import React from "react";
import { Finishboard, FinishboardEntry, normaliseFinishboard, Racer, Series, setFinishboardPosition } from "./scoring";

export interface IStorage {
  listSeries: () => SeriesCollection,
  listRacers: () => RacersCollection,

  newSeries: (name: string) => number;
  openSeries: (id: number) => ISeriesEditor;

  nextGlobalId: () => number;

  openRacer: (id: number) => IRacerEditor;
  newRacer: () => IRacerEditor;

  importSeries: (pack: PackedSeries) => number;
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

function openRacers(): RacersCollection {
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

function saveRacers(racers: RacersCollection) {
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

function openSeries(): SeriesCollection {
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

function saveSeries(series: SeriesCollection) {
  console.log(series)
  const result = {};
  for (const value of Object.values(series)) {
    result[value.id] = {
      name: value.name,
      racers: value.racers,
      finishboards: value.finishboards,
      draftFinishboard: value.draftFinishboard,
    };
    console.log(value.finishboards);
  }
  saveKey(SERIES_KEY, result);
}


function getBoardEditor(
  series: Series,
  board: Finishboard,
  update: (value: Finishboard) => void,
): IBoardEditor {
  const stored = { value: board };

  return {
    board: board,

    setPosition: (racerId, posistion) => {
      const newBoard = setFinishboardPosition(board, racerId, posistion);
      stored.value = newBoard;
      update(newBoard);
    },

    getRemaining: () => series.racers.filter(racer => ! board[racer]),

    clear: () => update({}),
  };
};

function getSeriesEditor(series: Series, save: () => void): ISeriesEditor {
  return {
    current: series,

    setName: (name) => {
      series.name = name;
      save();
    },

    addRacer: (id) => {
      series.racers.push(id);
      save();
    },
    removeRacer: (id) => {
      series.racers = series.racers.filter((item) => item != id);
      save();
    },

    openBoard: (index) => getBoardEditor(
      series,
      series.finishboards[index],
      (value) => {
        series.finishboards[index] = value;
        save();
      },
    ),

    deleteBoard: (index) => {
      series.finishboards = series.finishboards.filter((_, i) => i != index);
    },

    promoteDraft: () => {
      series.finishboards.push(series.draftFinishboard);
      series.draftFinishboard = null;
      save();
    },

    openDraft: () => getBoardEditor(
      series,
      series.draftFinishboard ?? {},
      (value) => {
        series.draftFinishboard = value;
        save();
      }
    ),
  };
}

function getRacerEdtitor(racer: Racer, save: () => void): IRacerEditor {
  return {
    current: racer,
    setName: (name) => {
      racer.name = name;
      save();
    },
    setNumber: (number) => {
      racer.number = number;
      save();
    },
    kill: () => "",
  };
}

function openLocalStorage(): IStorage {
  const racers = openRacers();
  const series = openSeries();

  const nextGlobalId = () => {
    const id = openKey(GLOBAL_ID_KEY) ?? 67;
    saveKey(GLOBAL_ID_KEY, id + 1);
    return id;
  }

  return {
    listSeries: () => series,
    listRacers: () => racers,

    newSeries: (name) => {
      const id = nextGlobalId();
      series[id] = {
        id: id,
        name: name,
        racers: [],
        finishboards: [],
        draftFinishboard: null,
      }
      saveSeries(series);
      return id;
    },

    openSeries: (id): ISeriesEditor => {
      const openedSeries = series[id];

      if (openedSeries) {
        return getSeriesEditor(openedSeries, () => saveSeries(series));
      } else {
        throw "series does not exist";
      }
    },

    newRacer: () => {
      const id = nextGlobalId();
      const newRacer: Racer = {
        id: id,
        name: "",
        number: "",
      };
      racers[id] = newRacer;
      saveRacers(racers);
      return getRacerEdtitor(newRacer, () => saveRacers(racers));
    },

    openRacer: (id) => {
      return getRacerEdtitor(racers[id], () => saveRacers(racers));
    },

    importSeries: (pack) => {
      const seriesRacers: number[] = [];

      let firstId: number;
      for (const racer of pack.racers) {
        const id = nextGlobalId();
        if (!firstId) {
          firstId = id;
        }
        racers[id] = {
          id: id,
          ...racer,
        };
        seriesRacers.push(id);
      }

      const finishboards: Finishboard[] = [];
      for (const packedBoard of pack.finishboards) {
        const newBoard = {};
        for (let i = 0; i < packedBoard.length; i++) {
          newBoard[firstId + i] = packedBoard[i];
        }
        finishboards.push(newBoard);
      }

      const seriesId = nextGlobalId();
      const newSeries: Series = {
        id: seriesId,
        name: pack.name,
        finishboards: finishboards,
        draftFinishboard: null,
        racers: seriesRacers,
      };

      series[seriesId] = newSeries;

      saveRacers(racers);
      saveSeries(series);

      return seriesId;
    },

    nextGlobalId: nextGlobalId,
  };
}

export const StorageContext =
  React.createContext<IStorage>(openLocalStorage());
