import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let firestoreDb;
try {
  const dbId = firebaseConfig.firestoreDatabaseId;
  const settings = {
    experimentalAutoDetectLongPolling: true,
  };
  firestoreDb = dbId
    ? initializeFirestore(app, settings, dbId)
    : initializeFirestore(app, settings);
} catch {
  firestoreDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export default app;
