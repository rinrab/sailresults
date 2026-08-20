import React from "react";
import { getStorageEditor, IStorage, openLegacyRacers, openSeries, saveSeries } from "./storage";

export const StorageContext = React.createContext<IStorage>(null);

export function StorageProvider({ children }) {
  let legacyRacers = React.useMemo(() => openLegacyRacers(), []);
  let [series, setSeries] = React.useState(() => openSeries(legacyRacers));

  const editor = getStorageEditor(
     () => series, 
     (mutate) => setSeries((old) => {
       series = mutate(old);
       saveSeries(series);
       return series;
     }),
  );

  return (
    <StorageContext.Provider value={editor}>
      {children}
    </StorageContext.Provider>
  );
}

