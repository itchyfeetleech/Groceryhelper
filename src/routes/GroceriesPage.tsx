import { useEffect } from 'react'
import { GroceryListView } from '../components/GroceryListView'
import { SavedListManager } from '../components/SavedListManager'
import { useStore } from '../state/store'
import { useIsApk } from '../utils/apk'

export function GroceriesPage() {
  const { selectedRecipeIds } = useStore()
  const apk = useIsApk()

  useEffect(() => {
    if (!apk) return
    let wakeLock: any = null
    const request = async () => {
      try {
        // @ts-ignore
        if (navigator.wakeLock?.request) wakeLock = await navigator.wakeLock.request('screen')
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
      <h1 className="text-xl font-semibold">Grocery list</h1>
      <GroceryListView />
      <SavedListManager />
      {selectedRecipeIds.length === 0 && (
        <p className="text-sm text-slate-500">Select recipes to generate a grocery list.</p>
      )}
    </div>
  )
}
