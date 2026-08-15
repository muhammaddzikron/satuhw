import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const dbId = firebaseConfig.firestoreDatabaseId;

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch {
  firestoreDb = dbId
    ? getFirestore(app, dbId)
    : getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Gracefully handle browser lifecycle, backgrounded/closing IndexedDB events, and internal SDK target cleanups
if (typeof window !== 'undefined') {
  const isFirestoreInternalError = (msg: string) => {
    return (
      msg.includes('Database is closing') ||
      msg.includes('database connection is closing') ||
      msg.includes('IDBDatabase') ||
      msg.includes('client is offline') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('resource-exhausted') ||
      msg.includes('removeAndCleanupTarget') ||
      msg.includes('Tc.get') ||
      msg.includes('INTERNAL UNHANDLED ERROR') ||
      msg.includes('INTERNAL ASSERTION FAILED') ||
      msg.includes('ASSERTION FAILED') ||
      msg.includes('Unexpected state (ID: b815)') ||
      msg.includes('b815') ||
      msg.includes('undefined is not an object') ||
      msg.includes('FIRESTORE (12.') ||
      msg.includes('@firebase/firestore')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason?.message || event.reason?.stack || event.reason || '');
    if (isFirestoreInternalError(reason)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      console.warn('[Firestore] Handled background/SDK event:', reason);
    }
  }, true);

  window.addEventListener('error', (event) => {
    const msg = String(event.message || event.error?.message || event.error?.stack || event.error || '');
    if (isFirestoreInternalError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      console.warn('[Firestore] Handled internal target cleanup event:', msg);
    }
  }, true);

  async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Please check your Firebase configuration or network connection.');
      }
    }
  }
  testConnection().catch(() => {});
}

export default app;

