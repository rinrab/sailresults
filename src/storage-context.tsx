import React from "react";
import { getStorageEditor, IStorage, openLegacyRacers, openSeries, saveSeries } from "./storage";
import { initializeFirebase } from "./storage-firebase";

export const StorageContext = React.createContext(null);

let initialized = false;
export let storage: IStorage;

export function StorageProvider({ children }) {
  let legacyRacers = React.useMemo(() => openLegacyRacers(), []);
  let [series, setSeries] = React.useState(() => openSeries(legacyRacers));

  storage = getStorageEditor(
     () => series, 
     (mutate) => setSeries((old) => {
       series = mutate(old);
       saveSeries(series);
       return series;
     }),
  );

  if (! initialized) {
    initialized = true;
    initializeFirebase();
  }

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}

