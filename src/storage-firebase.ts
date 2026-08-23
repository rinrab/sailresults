import { IPushEditor, Series } from "./storage";
import { initializeApp } from "firebase/app";
import { doc, collection, getFirestore, getDocs, where, query, onSnapshot, Unsubscribe, QuerySnapshot, DocumentData, writeBatch, WriteBatch } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithEmailLink, sendSignInLinkToEmail, ActionCodeSettings, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
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

function getBatchEditor(batch: WriteBatch): IPushEditor {
  return {
    add: (series) => {
      const resource = getRemoteSeries(series);
      const docRef = doc(seriesStore);
      batch.set(docRef, resource);
      return docRef.id;
    },
    update: (series) => {
      const resource = getRemoteSeries(series);
      batch.set(doc(seriesStore, series.firebaseId), resource);
      return series.firebaseId;
    },
    commit: async () => await batch.commit(),
  };
}

async function push() {
  if (auth.currentUser) {
    return storage.drivePush(getBatchEditor(writeBatch(db)));
  } else {
    console.log("can't push: unauthorized");
  }
}

export function getRemoteSeries(series: Series) {
  const resource = {
    name: series.name,
    racers: series.racers.map(racer => ({
      id: racer.id,
      name: racer.name,
      number: racer.number,
    })),
    finishboards: series.finishboards,
    draftFinishboard: series.draftFinishboard,
    lastEditedTime: series.lastEditedTime,
    owner: auth.currentUser?.uid,
  };

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
      storage.disconnect();
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
    storage.disconnect();
  } finally {
    blockSync = false;
  }
}

export async function sendResetPassword(
  email: string,
  progress: (message: string) => void
) {
  progress("Sending a reset password link...");
  const actionCode = {
    url: `${window.location.origin}/#/account/signin/`,
    handleCodeInApp: true,
  } satisfies ActionCodeSettings;

  await sendPasswordResetEmail(auth, email, actionCode);
  progress("Done.");
}
