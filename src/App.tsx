import { Outlet, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { initFirebaseSync } from './sync'
import { useStore } from './state/store'
import { saveStorage } from './utils/storage'
import { NavTabs } from './components/NavTabs'

export function App() {
  const location = useLocation()
  const getLocal = useStore((s) => ({ recipes: s.recipes, savedLists: s.savedLists, favourites: s.favourites }))

  useEffect(() => {
    initFirebaseSync({
      getLocalData: () => ({ schemaVersion: 1, ...getLocal }),
      onRemoteData: (data) => {
        // Apply remote to store without re-uploading immediately
        ;(useStore as any).setState({
          recipes: data.recipes ?? [],
          savedLists: data.savedLists ?? [],
          favourites: (data.favourites ?? []).map((f) => ({ name: f.name, section: 'standard' as const })),
        })
        saveStorage(data)
      },
    })
  }, [])
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container py-3 flex items-center gap-4">
          <Link to="/recipes" className="font-semibold text-lg">Recipe & Grocery Aggregator</Link>
          <NavTabs
            tabs={[
              { to: '/recipes', label: 'Recipes' },
              { to: '/items', label: 'Items' },
              { to: '/groceries', label: 'Grocery list' },
              { to: '/settings', label: 'Settings' }
            ]}
            activePath={location.pathname}
          />
        </div>
      </header>
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  )
}
