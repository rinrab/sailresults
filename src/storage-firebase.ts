import { IStorage } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, addDoc, collection, getFirestore, setDoc, getDocs, where, query } from "firebase/firestore";
import { Series } from "./scoring";
import { getAuth } from "firebase/auth";
import { storage } from "./storage-context";
import { firebaseConfig } from "./storage-firebase-config";

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const db = getFirestore(app);
const seriesStore = collection(db, "series");

let lastPulledId = null;

async function pull() {
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

async function push() {
  if (auth.currentUser) {
    const promises = Object.values(storage.listSeries())
      .map(series => SyncSeries(storage, series));

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

export function initializeFirebase() {
  auth.onAuthStateChanged(() => schedulePush());
  pull();
}

export function schedulePush() {
  if (pushTimeout) {
    clearTimeout(pushTimeout);
  }

  pushTimeout = setTimeout(() => {
    push();
  }, 1000);
}
