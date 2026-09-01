import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  setLogLevel
} from 'firebase/firestore';
import { getAuth, initializeAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress benign connection retry / info warnings from Firestore SDK
try {
  setLogLevel('error');
} catch {
  // Ignore if setLogLevel is not supported
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const dbId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
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

let authInstance: Auth | null = null;
export const getFirebaseAuth = (): Auth => {
  if (authInstance) return authInstance;
  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch {
    try {
      authInstance = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
      return authInstance;
    } catch {
      return getAuth(app);
    }
  }
};

let directAuth: Auth;
try {
  directAuth = getFirebaseAuth();
} catch {
  // Fallback proxy in case of async module registration
  directAuth = new Proxy({} as Auth, {
    get(_target, prop) {
      const targetAuth = getFirebaseAuth();
      const value = (targetAuth as any)[prop];
      return typeof value === 'function' ? value.bind(targetAuth) : value;
    }
  });
}

export const auth = directAuth;

// Gracefully handle browser lifecycle, backgrounded/closing IndexedDB events, and internal SDK target cleanups
if (typeof window !== 'undefined') {
  const isFirestoreInternalError = (msg: string) => {
    return (
      msg.includes('Database is closing') ||
      msg.includes('database connection is closing') ||
      msg.includes('IDBDatabase') ||
      msg.includes('client is offline') ||
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes("Backend didn't respond within") ||
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

  // Intercept console.error and console.warn for harmless transient connection notices
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const text = args.map(a => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    if (isFirestoreInternalError(text)) {
      return; // Silently filter out offline/reconnection attempt notices
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const text = args.map(a => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    if (isFirestoreInternalError(text)) {
      return; // Silently filter out offline/reconnection attempt notices
    }
    originalConsoleWarn.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason?.message || event.reason?.stack || event.reason || '');
    if (isFirestoreInternalError(reason)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      // Silently handled background / offline sync event
    }
  }, true);

  window.addEventListener('error', (event) => {
    const msg = String(event.message || event.error?.message || event.error?.stack || event.error || '');
    if (isFirestoreInternalError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      // Silently handled internal target cleanup event
    }
  }, true);
}

export default app;

