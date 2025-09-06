let cached: boolean | null = null

function mqlStandalone(): boolean {
  try {
    // Display-mode standalone/fullscreen are good signals when running as an app shell
    return (
      (window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches)) || false
    )
  } catch {
    return false
  }
}

function uaAndroid(): boolean {
  try { return /Android/i.test(navigator.userAgent) } catch { return false }
}

function hasApkHtmlClass(): boolean {
  try { return document.documentElement.classList.contains('apk') } catch { return false }
}

export function detectApkAndPersist(): boolean {
  try {
    const ref = document.referrer || ''
    const fromTwa = ref.startsWith('android-app://com.itchyfeetleech.groceryhelper')
    const hasParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('apk')
    const persisted = localStorage.getItem('isApk') === '1'
    const standalone = mqlStandalone() && uaAndroid()
    const hasClass = hasApkHtmlClass()
    const isApk = fromTwa || hasParam || persisted || standalone || hasClass
    if (isApk) {
      try { localStorage.setItem('isApk', '1') } catch {}
      try { document.documentElement.classList.add('apk') } catch {}
      cached = true
    }
    return isApk
  } catch {
    return false
  }
}

export function isApk(): boolean {
  if (cached !== null) return cached
  try {
    const persisted = localStorage.getItem('isApk') === '1'
    const result = persisted || hasApkHtmlClass() || (mqlStandalone() && uaAndroid())
    cached = result
    return result
  } catch {
    return false
  }
}

import { useSyncExternalStore } from 'react'
export function useIsApk(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const onStorage = (e: StorageEvent) => { if (e.key === 'isApk') cb() }
      window.addEventListener('storage', onStorage)
      // Also respond to visibility changes in case matchMedia starts matching later
      const onVis = () => cb()
      document.addEventListener('visibilitychange', onVis)
      return () => {
        window.removeEventListener('storage', onStorage)
        document.removeEventListener('visibilitychange', onVis)
      }
    },
    () => isApk(),
    () => false,
  )
}

