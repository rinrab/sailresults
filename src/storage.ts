import { Finishboard, FinishboardEntry, Racer, Series, setFinishboardPosition } from "./scoring";

export interface IStorage {
  listSeries: () => SeriesCollection,

  newSeries: (name: string) => number;
  openSeries: (id: number) => ISeriesEditor;
  deleteSeries: (id: number) => void;

  nextGlobalId: () => number;
}

export interface ISeriesEditor {
  current: Series,

  setName: (name: string) => void,

  newRacer: (name: string, number: string) => number,
  openRacer: (id: number) => IRacerEditor;
  deleteRacer: (id: number) => void,

  openBoard: (index: number) => IBoardEditor,
  deleteBoard: (index) => void,

  openDraft: () => IBoardEditor,
  promoteDraft: () => void,
}

export interface IBoardEditor {
  board: Finishboard,
  setPosition: (racerId: number, position: FinishboardEntry | null) => void,
  getRemaining: () => Racer[],
  clear: () => void,
}

export interface IRacerEditor {
  current: Racer,
  setName: (name: string) => void;
  setNumber: (number: string) => void;
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

type LegacyRacersCollection = { [id: number]: Racer };
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

    getRemaining: () => series.racers.filter(racer => ! board[racer.id]),

    clear: () => update(() => ({})),
  };
};

function getSeriesEditor(
  series: Series,
  update: Mutator<Series>
): ISeriesEditor {
  const findRacerIndex = (id: number) =>
    series.racers.findIndex(item => item.id == id);

  return {
    current: series,

    setName: (name) => update(old => ({
      ...old,
      name: name
    })),

    newRacer: (name, number) => {
      const id = nextGlobalId();
      update(old => ({
        ...old,
        racers: [
          ...old.racers,
          {
            id: id,
            name: name,
            number: number,
          }
        ],
      }));
      return id;
    },

    openRacer: (id) => {
      const index = findRacerIndex(id);

      return getRacerEditor(
        series.racers[index],
        (mutate) => update(old => {
          const copy = [...old.racers];
          copy[index] = mutate(copy[index]);
          return {
            ...old,
            racers: copy,
          };
        }),
      );
    },

    deleteRacer: (id) => update(old => ({
      ...old,
      racers: old.racers.filter(racer => racer.id != id),
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

    deleteBoard: (index) => update((old) => ({
      ...old,
      finishboards: series.finishboards.filter((_, i) => i != index),
    })),

    promoteDraft: () => update(old => {
      if (! old.draftFinishboard) {
        throw new Error("the draft is empty");
      }

      return {
        ...old,
        finishboards: [...old.finishboards, old.draftFinishboard],
        draftFinishboard: null,
      }
    }),

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
  };
}

function nextGlobalId() {
  const id = openKey(GLOBAL_ID_KEY) ?? 67;
  saveKey(GLOBAL_ID_KEY, id + 1);
  return id;
}

export function getStorageEditor(
  getSeries: () => SeriesCollection,
  updateSeries: Mutator<SeriesCollection>,
): IStorage {
  return {
    listSeries: () => getSeries(),

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

    deleteSeries: (id) => updateSeries((old) => {
      const copy = { ...old };
      delete copy[id];
      return copy;
    }),

    nextGlobalId: nextGlobalId,
  };
}

export function importSeries(storage: IStorage, pack: PackedSeries) {
  const seriesId = storage.newSeries(pack.name);
  const series = storage.openSeries(seriesId);

  let firstId: number;
  for (const packedRacer of pack.racers) {
    const id = series.newRacer(packedRacer.name, packedRacer.number);
    if (!firstId) {
      firstId = id;
    }
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
