import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GroceryListView } from '../components/GroceryListView'
import { SavedListManager } from '../components/SavedListManager'
import { useStore } from '../state/store'
import { useIsApk } from '../utils/apk'

export function GroceriesPage() {
  const { selectedRecipeIds } = useStore()
  const apk = useIsApk()

  useEffect(() => {
    if (!apk) return
    type WakeLockSentinel = { release?: () => Promise<void> }
    type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } }
    let wakeLock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        const nav = navigator as WakeLockNavigator
        if (nav.wakeLock?.request) wakeLock = await nav.wakeLock.request('screen')
      } catch {}
    }
    request()
    const onVis = () => {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      try { wakeLock?.release?.() } catch {}
    }
  }, [apk])
  return (
    <div className="space-y-6">
      <h1 className="page-title">Grocery list</h1>
      {selectedRecipeIds.length === 0 && (
        <div className="card p-3 text-sm text-soft">
          No recipes selected for this week.{' '}
          <Link to="/recipes" className="font-medium text-[var(--accent-700)] underline underline-offset-2 decoration-[var(--accent-300)]">
            Pick recipes
          </Link>{' '}
          to generate a grocery list, or add individual items below.
        </div>
      )}
      <GroceryListView />
      <SavedListManager />
    </div>
  )
}
