import { IStorage } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, addDoc, collection, getFirestore, setDoc, getDocs, where, query, onSnapshot, Unsubscribe, QuerySnapshot, DocumentData, writeBatch } from "firebase/firestore";
import { Series } from "./scoring";
import { Auth, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { storage } from "./storage-context";
import { firebaseConfig } from "./storage-firebase-config";

const app = initializeApp(firebaseConfig);
export const auth = getAuth();

const db = getFirestore(app);
const seriesStore = collection(db, "series");

function buildSeriesQuery() {
  return query(seriesStore, where("owner", "==", auth.currentUser.uid));
}

function pull(snapshot: QuerySnapshot<DocumentData, DocumentData>) {
  console.log("pull")
  // TODO: verify data
  snapshot.forEach((doc) => {
    storage.pullSeries(doc.id, doc.data());
  });
}

function disconnect() {
  /* if no user is authenticated, remove all local copies that had been
   * synced before (have firebaseId) but have no local modifications */
  Object.values(storage.listSeries())
    .filter(series => series.firebaseId && ! series.needsSync)
    .map(series => storage.deleteSeries(series.id));
}

async function push() {
  if (auth.currentUser) {
    const batch = writeBatch(db);

    Object.values(storage.listSeries())
      .filter(series => series.needsSync || ! series.firebaseId)
      .map(async (series) => {
        const resource = getRemoteSeries(series);

        if (series.firebaseId) {
          batch.set(doc(seriesStore, series.firebaseId), resource);
        } else {
          const docRef = doc(seriesStore);
          batch.set(docRef, resource);
          storage.openSeries(series.id).setFirebaseId(docRef.id);
        }

        storage.openSeries(series.id).setNeedsSync(false);
      });

    return batch.commit();
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
let blockSync = false;
let snapshotListenerUnsubscribe: Unsubscribe | null = null;

auth.onAuthStateChanged(async () => {
  if (snapshotListenerUnsubscribe) {
    snapshotListenerUnsubscribe();
  }

  if (auth.currentUser) {
    snapshotListenerUnsubscribe = onSnapshot(buildSeriesQuery(), (snapshot) => {
      if (! snapshot.metadata.hasPendingWrites && ! blockSync) {
        console.log("snapshot");
        pull(snapshot);
        schedulePush();
      }
    });
  } else {
    if (! blockSync) {
      disconnect();
    }
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
  blockSync = true;
  try {
    progress("Logging in...");
    await signInWithEmailAndPassword(auth, email, password);
    progress("Fetching data from the server...");
    pull(await getDocs(buildSeriesQuery()));
    progress("Uploading local data to the server...");
    await push();
    progress("Done!");
  } finally {
    blockSync = false;
  }
}

export async function signUp(
  email: string,
  password: string,
  progress: (message: string) => void
) {
  blockSync = true;
  try {
    progress("Creating an account...");
    await createUserWithEmailAndPassword(auth, email, password);
    progress("Uploading local data to the server...");
    await push();
    progress("Done!");
  } finally {
    blockSync = false;
  }
}

export async function signOut() {
  blockSync = true;
  try {
    await auth.signOut();
    disconnect();
  } finally {
    blockSync = false;
  }
}
