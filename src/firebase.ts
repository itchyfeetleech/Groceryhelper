import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, type User, type Auth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore'

type FirebaseBundle = {
  enabled: boolean
  app?: FirebaseApp
  auth?: Auth
  db?: Firestore
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

const hasConfig = Object.values(cfg).every(Boolean)

const bundle: FirebaseBundle = { enabled: hasConfig }

if (hasConfig) {
  const app = getApps().length ? getApps()[0]! : initializeApp(cfg as any)
  const auth = getAuth(app)
  const db = getFirestore(app)
  // Best-effort offline persistence with tab sync
  enableIndexedDbPersistence(db, { synchronizeTabs: true }).catch(() => {})

  bundle.app = app
  bundle.auth = auth
  bundle.db = db
}

export { bundle as fb }
