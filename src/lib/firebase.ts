import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch {
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
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Gracefully handle browser lifecycle and backgrounded/closing IndexedDB events
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason?.message || event.reason || '');
    if (
      reason.includes('Database is closing') ||
      reason.includes('database connection is closing') ||
      reason.includes('IDBDatabase') ||
      reason.includes('client is offline') ||
      reason.includes('Quota limit exceeded') ||
      reason.includes('resource-exhausted')
    ) {
      event.preventDefault();
      console.warn('[Firestore] Suppressed background/closing event:', reason);
    }
  });

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

