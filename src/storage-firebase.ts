import { IStorage } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, addDoc, collection, getFirestore, setDoc, getDocs, where, query } from "firebase/firestore";
import { Series } from "./scoring";
import { Auth, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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
      .map(async (series) => {
        const resource = getRemoteSeries(series);

        if (series.firebaseId) {
          await setDoc(doc(seriesStore, series.firebaseId), resource);
        } else {
          const docRef = await addDoc(seriesStore, resource);
          storage.openSeries(series.id).setFirebaseId(docRef.id);
        }

        storage.openSeries(series.id).setNeedsSync(false);
      });

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

let pushTimeout: NodeJS.Timeout | null = null;
let onAuthBlocked = false;

auth.onAuthStateChanged(async () => {
  if (! onAuthBlocked) {
    await pull();
    schedulePush();
  }
});

export function schedulePush() {
  if (pushTimeout) {
    clearTimeout(pushTimeout);
  }

  pushTimeout = setTimeout(() => {
    push();
  }, 1000);
}

export function isAuthorized() {
  return !! auth.currentUser;
}

export async function signIn(
  email: string,
  password: string,
  progress: (message: string) => void
) {
  onAuthBlocked = true;
  try {
    progress("Logging in...");
    await signInWithEmailAndPassword(auth, email, password);
    progress("Fetching data from the server...");
    await pull();
    progress("Uploading local data to the server...");
    await push();
    progress("Done!");
  } finally {
    onAuthBlocked = false;
  }
}

export async function signUp(
  email: string,
  password: string,
  progress: (message: string) => void
) {
  onAuthBlocked = true;
  try {
    progress("Creating an account...");
    await createUserWithEmailAndPassword(auth, email, password);
    progress("Uploading local data to the server...");
    await push();
    progress("Done!");
  } finally {
    onAuthBlocked = false;
  }
}
