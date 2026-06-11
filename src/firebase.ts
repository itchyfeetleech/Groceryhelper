import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export type FirebaseBundle = {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

// Only require the fields needed to initialize the Firebase app.
export const hasFirebaseConfig = [cfg.apiKey, cfg.authDomain, cfg.projectId, cfg.appId].every(Boolean)

let bundlePromise: Promise<FirebaseBundle | null> | null = null

/**
 * Lazily load and initialize the Firebase SDK. Keeps the (large) SDK out of the
 * main bundle; resolves null when sync is not configured.
 */
export function getFirebase(): Promise<FirebaseBundle | null> {
  if (!hasFirebaseConfig) return Promise.resolve(null)
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const [{ initializeApp, getApps }, { getAuth }, firestore] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      const app = getApps().length ? getApps()[0]! : initializeApp(cfg as Record<string, string>)
      const auth = getAuth(app)
      // Offline persistence with multi-tab sync
      const db = firestore.initializeFirestore(app, {
        localCache: firestore.persistentLocalCache({ tabManager: firestore.persistentMultipleTabManager() }),
      })
      return { app, auth, db }
    })()
  }
  return bundlePromise
}
