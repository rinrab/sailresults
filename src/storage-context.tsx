import React from "react";
import { getStorageEditor, IStorage, openRacers, openSeries, saveRacers, saveSeries } from "./storage";

export const StorageContext = React.createContext<IStorage>(null);

export function StorageProvider({ children }) {
  let [racers, setRacers] = React.useState(() => openRacers());
  let [series, setSeries] = React.useState(() => openSeries());

  const editor = getStorageEditor(
     () => racers,
     (mutate) => setRacers((old) => {
       racers = mutate(old);
       saveRacers(racers);
       return racers;
     }),
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

