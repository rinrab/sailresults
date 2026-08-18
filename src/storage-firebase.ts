import { IStorage } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, addDoc, collection, getFirestore, setDoc, getDocs, where, query } from "firebase/firestore";
import { Series } from "./scoring";
import { getAuth } from "firebase/auth";
import { storage } from "./storage-context";
import { firebaseConfig } from "./storage-firebase-config";

const app = initializeApp(firebaseConfig);
export const auth = getAuth();

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

    snapshot.forEach((doc) => {
      storage.pullSeries(doc.id, doc.data());
    });
  } else {
    /* if no user is authenticated, remove all local copies that had been
     * synced before (have firebaseId) but have no local modifications */
    Object.values(storage.listSeries())
      .filter(series => series.firebaseId && ! series.needsSync)
      .map(series => storage.deleteSeries(series.id));
  }
}

async function push() {
  if (auth.currentUser) {
    console.log(storage);
    const promises = Object.values(storage.listSeries())
      .filter(series => series.needsSync)
      .map(series => SyncSeries(storage, series));

    await Promise.all(promises);
  } else {
    console.log("can't push: unauthorized");
  }
}

export function getRemoteSeries(series: Series) {
  const resource = {
    ...series,
    owner: auth.currentUser?.uid,
  };

  delete resource.needsSync;
  delete resource.firebaseId;
  delete resource.id;

  return resource;
}

async function SyncSeries(storage: IStorage, series: Series) {
  const resource = getRemoteSeries(series);

  try {
    if (series.firebaseId) {
      await setDoc(doc(seriesStore, series.firebaseId), resource);
      storage.openSeries(series.id).setNeedsSync(false);
    } else {
      const docRef = await addDoc(seriesStore, resource);
      storage.openSeries(series.id).setFirebaseId(docRef.id);
    }

    console.log("pushed", resource);
  } catch (e) {
    console.error("Error syncing document: ", e, resource);
  }
}

let pushTimeout: NodeJS.Timeout | null = null;

auth.onAuthStateChanged(async () => {
  await pull();
  schedulePush();
});

export function schedulePush() {
  if (pushTimeout) {
    clearTimeout(pushTimeout);
  }

  pushTimeout = setTimeout(() => {
    push();
  }, 1000);
}
