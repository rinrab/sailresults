import React from "react";
import { getStorageEditor, IStorage, openLegacyRacers, openSeries, saveSeries } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, addDoc, collection, getFirestore, runTransaction, setDoc, getDocs, where, query } from "firebase/firestore";
import { Series } from "./scoring";
import { getAuth } from "firebase/auth";

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
const auth = getAuth();

const db = getFirestore(app);
const seriesStore = collection(db, "series");

let lastPulledId = null;

async function pull(editor: IStorage) {
  if (auth.currentUser) {
    if (lastPulledId == auth.currentUser.uid) {
      return;
    }

    const snapshot = await getDocs(
      query(seriesStore, where("owner", "==", auth.currentUser.uid))
    )

    console.log(snapshot.docs);
  } else {
    console.log("can't pull: unauthorized");
  }
}

async function push(editor: IStorage) {
  if (auth.currentUser) {
    const promises = Object.values(editor.listSeries())
      .map(series => SyncSeries(editor, series));

    await Promise.all(promises);
  } else {
    console.log("can't push: unauthorized");
  }
}

async function SyncSeries(storage: IStorage, series: Series) {
  const resource = {
    ...series,
    owner: auth.currentUser.uid,
  };

  try {
    if (series.firebaseId) {
      await setDoc(doc(seriesStore, series.firebaseId), resource);
    } else {
      const docRef = await addDoc(seriesStore, resource);
      const editor = storage.openSeries(series.id);
      editor.setFirebaseId(docRef.id);
    }

    console.log("synced", resource);
  } catch (e) {
    console.error("Error syncing document: ", e, resource);
  }
}


let pushTimeout: NodeJS.Timeout | null = null;
let initialized = false;

export function StorageProvider({ children }) {
  let legacyRacers = React.useMemo(() => openLegacyRacers(), []);
  let [series, setSeries] = React.useState(() => openSeries(legacyRacers));

  const storage = getStorageEditor(
     () => series, 
     (mutate) => setSeries((old) => {
       series = mutate(old);
       saveSeries(series);
       return series;
     }),
  );

  const schedule = () => {
    if (pushTimeout) {
      clearTimeout(pushTimeout);
    }

    pushTimeout = setTimeout(() => {
      push(storage);
    }, 1000);
  };

  if (! initialized) {
    initialized = true;
    auth.onAuthStateChanged(() => schedule());
    pull(storage);
  }

  storage.onSeriesChanged(() => schedule());

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}

