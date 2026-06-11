import { useSyncExternalStore } from 'react'
import { getFirebase, hasFirebaseConfig } from './firebase'
import type { User } from 'firebase/auth'
import type { StorageSchema } from './types'

let currentUser: User | null = null
let unsubscribeSnap: (() => void) | null = null
let lastPushedAt: string | null = null
let pendingData: StorageSchema | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null

const authListeners = new Set<() => void>()
function notifyAuthListeners() {
  for (const cb of authListeners) cb()
}
function setCurrentUser(user: User | null) {
  currentUser = user
  notifyAuthListeners()
}

type InitParams = {
  getLocalData: () => StorageSchema
  onRemoteData: (data: StorageSchema) => void
}

export async function initFirebaseSync(params: InitParams) {
  const fb = await getFirebase()
  if (!fb) return
  const { onAuthStateChanged, signInAnonymously } = await import('firebase/auth')
  const { doc, getDoc, onSnapshot, setDoc } = await import('firebase/firestore')

  onAuthStateChanged(fb.auth, async (user) => {
    setCurrentUser(user)
    if (!user) {
      // Try anonymous sign-in; if disabled in console, ignore and allow Google sign-in from UI
      try { await signInAnonymously(fb.auth) } catch {}
      return
    }

    // Ensure subscription to user's state doc
    if (unsubscribeSnap) { unsubscribeSnap(); unsubscribeSnap = null }
    const ref = doc(fb.db, 'users', user.uid, 'state', 'app')

    // Initial hydrate decision
    try {
      const snap = await getDoc(ref)
      const local = params.getLocalData()
      if (!snap.exists()) {
        // No remote yet; upload local snapshot
        await setDoc(ref, { ...local, __meta: { updatedAt: new Date().toISOString(), source: 'client' } })
        lastPushedAt = new Date().toISOString()
      } else {
        const remote = snap.data() as Record<string, unknown>
        const remoteEmpty = isEmptyRemote(remote)
        const localEmpty = isEmptyLocal(local)
        const remoteUpdatedAt = (remote?.__meta as { updatedAt?: string } | undefined)?.updatedAt
        const localUpdatedAt = getLocalUpdatedAt()

        if (remoteEmpty && !localEmpty) {
          await setDoc(ref, { ...local, __meta: { updatedAt: new Date().toISOString(), source: 'client' } })
          lastPushedAt = new Date().toISOString()
        } else if (!remoteEmpty && localEmpty) {
          params.onRemoteData(normalizeRemote(remote))
        } else {
          // Both have data; prefer newer by timestamp else prefer remote
          if (localUpdatedAt && remoteUpdatedAt && localUpdatedAt > remoteUpdatedAt) {
            await setDoc(ref, { ...local, __meta: { updatedAt: new Date().toISOString(), source: 'client' } })
            lastPushedAt = new Date().toISOString()
          } else {
            params.onRemoteData(normalizeRemote(remote))
          }
        }
      }
    } catch {
      // ignore; subscription below will continue
    }

    unsubscribeSnap = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return
      const remote = snap.data() as Record<string, unknown>
      const remoteUpdatedAt = (remote?.__meta as { updatedAt?: string } | undefined)?.updatedAt
      if (remoteUpdatedAt && lastPushedAt && remoteUpdatedAt === lastPushedAt) {
        // Our own write echoed; ignore
        return
      }
      params.onRemoteData(normalizeRemote(remote))
    })
  })
}

// Debounced remote save; called by store persist
export function queueRemoteSave(data: StorageSchema) {
  if (!hasFirebaseConfig || !currentUser) return
  pendingData = data
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    if (!pendingData || !currentUser) return
    const toPush = pendingData
    pendingData = null
    const fb = await getFirebase()
    if (!fb) return
    const { doc, setDoc } = await import('firebase/firestore')
    const ts = new Date().toISOString()
    const ref = doc(fb.db, 'users', currentUser.uid, 'state', 'app')
    await setDoc(ref, { ...toPush, __meta: { updatedAt: ts, source: 'client' } })
    lastPushedAt = ts
  }, 400)
}

export const syncEnabled = hasFirebaseConfig

function subscribeAuth(cb: () => void) {
  authListeners.add(cb)
  return () => {
    authListeners.delete(cb)
  }
}

/** React hook: current sync user, re-rendering on auth changes. */
export function useSyncUser(): User | null {
  return useSyncExternalStore(
    subscribeAuth,
    () => currentUser,
    () => null,
  )
}

export async function signOutSync() {
  const fb = await getFirebase()
  if (fb) await fb.auth.signOut()
}

export async function signInWithGoogle() {
  const fb = await getFirebase()
  if (!fb) return
  const { GoogleAuthProvider, linkWithPopup, signInWithPopup, linkWithRedirect, signInWithRedirect } = await import(
    'firebase/auth'
  )
  const provider = new GoogleAuthProvider()
  try {
    if (currentUser && currentUser.isAnonymous) {
      await linkWithPopup(currentUser, provider)
    } else {
      await signInWithPopup(fb.auth, provider)
    }
    // Linking does not always fire onAuthStateChanged; refresh explicitly
    setCurrentUser(fb.auth.currentUser)
  } catch {
    // Popup blocked or disallowed; try redirect
    try {
      if (currentUser && currentUser.isAnonymous) {
        await linkWithRedirect(currentUser, provider)
      } else {
        await signInWithRedirect(fb.auth, provider)
      }
    } catch {
      // ignore
    }
  }
}

function isEmptyLocal(s: StorageSchema): boolean {
  return (s.recipes?.length ?? 0) === 0 && (s.savedLists?.length ?? 0) === 0 && (s.favourites?.length ?? 0) === 0
}

function isEmptyRemote(r: any): boolean {
  return ((r?.recipes || []).length === 0) && ((r?.savedLists || []).length === 0) && ((r?.favourites || []).length === 0)
}

function normalizeRemote(r: any): StorageSchema {
  return {
    schemaVersion: 1,
    recipes: Array.isArray(r?.recipes) ? r.recipes : [],
    savedLists: Array.isArray(r?.savedLists) ? r.savedLists : [],
    favourites: Array.isArray(r?.favourites) ? r.favourites : [],
  }
}

// Local updatedAt is stored separately in localStorage (updated by store persist)
const UPDATED_KEY = 'recipe-grocery-aggregator:v1:updatedAt'
export function bumpLocalUpdatedAt() {
  try { localStorage.setItem(UPDATED_KEY, new Date().toISOString()) } catch {}
}
export function getLocalUpdatedAt(): string | null {
  try { return localStorage.getItem(UPDATED_KEY) } catch { return null }
}
