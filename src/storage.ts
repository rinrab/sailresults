import { auth, getRemoteSeries, schedulePush } from "./storage-firebase";
import { DEFAULT_DISQUALIFICATION, setFinishboardPosition } from "./scoring";
import { nextGlobalId } from "./storage-json";

export interface Series {
  id: number;
  name: string;
  racers: Racer[];
  finishboards: Finishboard[];
  draftFinishboard: Finishboard | null;
  lastEditedTime: string;
  firebaseId?: string;
  needsSync: boolean;
  remoteModified: boolean;
  scheduleForDelete?: boolean;
}

export interface Racer {
  id: number;
  name: string;
  number: string;
}

export type FinishboardEntry = number | "DNC" | "DNS" | "DNF" | "NSC" | "UFD" | "BFD" | "RET" | "DSQ";
export type Finishboard = { 
  [racerId: number]: FinishboardEntry
}

export interface IPushEditor {
  add: (series: Series) => string;
  update: (series: Series) => string;
  delete: (series: Series) => void;
  commit: () => Promise<void>;
}

export type SeriesCollection = { [id: number]: Series };

export interface IStorage {
  listSeries: () => SeriesCollection,

  newSeries: (name: string) => number;
  openSeries: (id: number) => ISeriesEditor;
  deleteSeries: (id: number) => void;
  importSeries: (pack: PackedSeries) => number;

  pullSeriesUpdate: (firebaseId: string, data: any) => void;
  pullSeriesDelete: (firebaseId: string) => void;

  drivePush: (editor: IPushEditor) => Promise<void>;
  disconnect: () => void;

  nextGlobalId: () => number;
}

export interface ISeriesEditor {
  current: Series,

  setName: (name: string) => void,

  newRacer: (name: string, number: string) => number,
  openRacer: (id: number) => IRacerEditor | null;
  deleteRacer: (id: number) => void,

  openBoard: (index: number) => IBoardEditor,
  deleteBoard: (index) => void,

  openDraft: () => IBoardEditor,
  promoteDraft: () => void,

  setFirebaseId: (id: string) => void;
  setNeedsSync: (value: boolean) => void;
}

export interface IBoardEditor {
  board: Finishboard,
  setPosition: (racerId: number, position: FinishboardEntry | null) => void,
  push: (racerId: number, position: FinishboardEntry | null) => void,
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

    push: (racerId, posistion) => update(old => {
      return { old, [racerId]: posistion };
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

      if (index == -1) {
        return null;
      }

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

    setFirebaseId: (firebaseId) => update((old) => ({
      ...old,
      firebaseId: firebaseId,
    })),
    setNeedsSync: (value) => update((old) => ({
      ...old,
      needsSync: value,
    })),
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

export function getCurrentTime() {
  const date = new Date(); 
  return date.toISOString();
}

function seriesAreEqual(left: Series, right: Series) {
  if (left == right) {
    return true;
  }

  if (! left || ! right) {
    return false;
  }

  return JSON.stringify(getRemoteSeries(left)) ==
         JSON.stringify(getRemoteSeries(right))
}

export function getStorageEditor(
  getSeries: () => SeriesCollection,
  updateSeries: Mutator<SeriesCollection>,
): IStorage {
  const updateOneSeries = (id: number, mutate: (old: Series) => Series) => {
    updateSeries((old) => {
      const oldValue = old[id];
      const newValue = mutate(oldValue);

      if (! seriesAreEqual(oldValue, newValue)) {
        schedulePush();
        newValue.needsSync = true;
        newValue.lastEditedTime = getCurrentTime();
        newValue.remoteModified = false;
      }

      return {
        ...old,
        [id]: newValue,
      };
    })
  };

  const wcDeleteSeries = (id: number) => updateSeries((old) => {
    const copy = { ...old };
    delete copy[id];
    return copy;
  });

  return {
    listSeries: () => getSeries(),

    newSeries: (name) => {
      const id = nextGlobalId();
      updateOneSeries(id, (old) => ({
          id: id,
          name: name,
          racers: [],
          finishboards: [],
          draftFinishboard: null,
          lastEditedTime: getCurrentTime(),
          needsSync: true,
          remoteModified: false,
      }));
      return id;
    },

    openSeries: (id): ISeriesEditor => {
      const openedSeries = getSeries()[id];

      if (openedSeries) {
        return getSeriesEditor(
          openedSeries,
          (mutate) => updateOneSeries(id, mutate),
        );
      } else {
        throw new Error("series does not exist");
      }
    },

    deleteSeries: (id) => {
      if (auth.currentUser) {
        updateOneSeries(id, (old) => ({
          ...old,
          scheduleForDelete: true,
        }))
        schedulePush();
      } else {
        wcDeleteSeries(id);
      }
    },

    importSeries: (pack: PackedSeries) => {
      const startId = nextGlobalId();
      const newSeries: Series = {
        id: startId,
        name: pack.name,
        racers: pack.racers.map(racer => ({
          id: nextGlobalId(),
          name: racer.name,
          number: racer.number
        })),
        finishboards: pack.finishboards.map(board => {
          const result: Finishboard = {};
          for (let i = 0; i < board.length; i++) {
            result[startId + i + 1] = board[i];
          }
          return result;
        }),
        draftFinishboard: null,
        lastEditedTime: getCurrentTime(),
        needsSync: true,
        remoteModified: false,
      };

      updateSeries(old => ({
        ...old,
        [newSeries.id]: newSeries,
      }));

      return newSeries.id;
    },

    pullSeriesUpdate: (firebaseId, data: any) => updateSeries((old) => {
      const series = Object.values(old).find(series => series.firebaseId == firebaseId);

      if (series?.needsSync) {
        /* don't overwrite with local modification */
        return old;
      }

      const newValue = {
        ...data,
        id: series?.id ?? nextGlobalId(),
        firebaseId: firebaseId,
        needsSync: false,
        remoteModified: true,
      } satisfies Series;

      if (seriesAreEqual(series, newValue)) {
        /* don't update if pulled series is no different from the one we have
         * locally */
        return old;
      }

      return {
        ...old,
        [newValue.id]: newValue,
      };
    }),

    pullSeriesDelete: (firebaseId) => updateSeries((old) => {
      const result = {};
      for (const series of Object.values(old)) {
        if (series.firebaseId != firebaseId) {
          result[series.id] = series;
        }
      }
      return result;
    }),

    drivePush: async (pushEditor) => {
      const postCommit = [];

      Object.values(getSeries())
        .filter(series => series.needsSync || ! series.firebaseId || series.scheduleForDelete)
        .map((series) => {
          if (series.scheduleForDelete) {
            pushEditor.delete(series);
            postCommit.push(() => wcDeleteSeries(series.id));
          } else {
            let firebaseId: string;
            if (series.firebaseId) {
              firebaseId = pushEditor.update(series);
            } else {
              firebaseId = pushEditor.add(series);
            }

            postCommit.push(() => updateSeries(old => ({
              ...old,
              [series.id]: {
                ...old[series.id],
                needsSync: false,
                firebaseId: firebaseId,
              }
            })));
          }
        });

      await pushEditor.commit();

      /* aborted if commit() throw an error */

      postCommit.map(action => action());
    },

    disconnect: () => updateSeries((old) => {
      const result = {};

      for (const series of Object.values(old)) {
        /* if it was asked to delete this item, just get rid of it to avoid
         * stale states */
        if (series.scheduleForDelete) {
          continue;
        }

        /* if no user is authenticated, remove all local copies that had been
         * synced before (have firebaseId) but have no local modifications
         *
         * keeping it only if either it wasn't synced or firebaseId is missing
         * and it also wasn't synced 
         * */
        if (! series.firebaseId || series.needsSync) {
          result[series.id] = series;
        }
      }

      return result;
    }),

    nextGlobalId: nextGlobalId,
  };
}

export function makeSeriesPack(series: Series): PackedSeries {
  return {
    name: series.name,
    racers: series.racers.map(racer => ({
      name: racer.name,
      number: racer.number
    })),
    finishboards: series.finishboards.map(board =>
      series.racers.map(racer => board[racer.id] ?? DEFAULT_DISQUALIFICATION)
    )
  };
}
