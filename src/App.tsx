import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { initFirebaseSync } from './sync'
import { useStore } from './state/store'
import { saveStorage } from './utils/storage'
import { NavTabs } from './components/NavTabs'
import { BottomNav } from './components/BottomNav'
import { detectApkAndPersist, useIsApk } from './utils/apk'
import { ToastProvider } from './ui/Toast'
import { useSwipeable } from 'react-swipeable'

export function App() {
  const location = useLocation()
  const getLocal = useStore((s) => ({ recipes: s.recipes, savedLists: s.savedLists, favourites: s.favourites }))
  const apk = useIsApk()

  useEffect(() => {
    // Detect APK (TWA) and annotate document
    detectApkAndPersist()
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
  const navigate = useNavigate()
  const routes = useMemo(() => ['/recipes', '/items', '/groceries', '/settings'], [])
  const idx = routes.findIndex((r) => location.pathname.startsWith(r))
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { if (apk && idx >= 0 && idx < routes.length - 1) navigate(routes[idx + 1]) },
    onSwipedRight: () => { if (apk && idx > 0) navigate(routes[idx - 1]) },
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 40,
    trackTouch: true,
    touchEventOptions: { passive: true },
  })

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <ToastProvider>
      <div className={apk ? 'min-h-screen apk-root' : 'min-h-screen'} {...(apk ? swipeHandlers : {})}>
        <header className={(scrolled ? 'shadow-sm ' : '') + 'app-header border-b bg-white/80 backdrop-blur sticky top-0 z-20 hidden md:block'}>
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
        <main className={apk ? 'container py-3 has-bottom-nav' : 'container py-4'}>
          <Outlet />
        </main>
        {apk && <BottomNav activePath={location.pathname} />}
      </div>
    </ToastProvider>
  )
}
