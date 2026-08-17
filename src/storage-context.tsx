import React from "react";
import { getStorageEditor, IStorage, openLegacyRacers, openSeries, saveSeries } from "./storage";
import { initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { Series } from "./scoring";

export const StorageContext = React.createContext<IStorage>(null);

const firebaseConfig = {
  apiKey: "AIzaSyAy8l4WJmdHngHhoY-z7-L1VL1WG8vB_Yc",
  authDomain: "sailresults-staging.firebaseapp.com",
  projectId: "sailresults-staging",
  storageBucket: "sailresults-staging.firebasestorage.app",
  messagingSenderId: "502927475203",
  appId: "1:502927475203:web:d43f5059493cb2ab3e4436"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const seriesStore = collection(db, "series");

async function SyncSeries(series: Series) {
  try {
    const docRef = await addDoc(seriesStore, series);

    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export function StorageProvider({ children }) {
  let legacyRacers = React.useMemo(() => openLegacyRacers(), []);
  let [series, setSeries] = React.useState(() => openSeries(legacyRacers));

  const editor = getStorageEditor(
     () => series, 
     (mutate) => setSeries((old) => {
       series = mutate(old);
       saveSeries(series);

       Object.values(editor.listSeries()).map(series => SyncSeries(series));

       return series;
     }),
  );

  return (
    <StorageContext.Provider value={editor}>
      {children}
    </StorageContext.Provider>
  );
}

