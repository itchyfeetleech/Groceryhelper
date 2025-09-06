let cached: boolean | null = null

export function detectApkAndPersist() {
  try {
    const ref = document.referrer || ''
    const fromTwa = ref.startsWith('android-app://com.itchyfeetleech.groceryhelper')
    const hasParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('apk')
    const persisted = localStorage.getItem('isApk') === '1'
    const isApk = fromTwa || hasParam || persisted
    if (isApk) {
      localStorage.setItem('isApk', '1')
      document.documentElement.classList.add('apk')
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
    cached = localStorage.getItem('isApk') === '1'
    return !!cached
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
      return () => window.removeEventListener('storage', onStorage)
    },
    () => isApk(),
    () => false,
  )
}

