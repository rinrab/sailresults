import React from "react";
import { getStorageEditor, IStorage, openLegacyRacers, openSeries, saveSeries } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, addDoc, collection, getFirestore, runTransaction, setDoc } from "firebase/firestore";
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

async function SyncSeries(storage: IStorage, series: Series) {
  try {
    if (series.firebaseId) {
      setDoc(doc(seriesStore, series.firebaseId), series);
    } else {
      const docRef = await addDoc(seriesStore, series);
      const editor = storage.openSeries(series.id);
      editor.setFirebaseId(docRef.id);
    }
  } catch (e) {
    console.error("Error syncing document: ", e);
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

       Object.values(editor.listSeries()).map(series => SyncSeries(editor, series));

       return series;
     }),
  );

  return (
    <StorageContext.Provider value={editor}>
      {children}
    </StorageContext.Provider>
  );
}

