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
  const [updateAvailable, setUpdateAvailable] = useState(false)

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

  // Poll for new deployed version and prompt to refresh
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const base = (import.meta as any).env.BASE_URL || '/'
        const url = base.replace(/\/$/, '/') + 'version.txt?ts=' + Date.now()
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const txt = (await res.text()).trim()
        if (txt && typeof __APP_VERSION__ !== 'undefined' && txt !== __APP_VERSION__) {
          if (!cancelled) setUpdateAvailable(true)
        }
      } catch {}
    }
    check()
    const id = setInterval(check, 60_000)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
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
          {updateAvailable && (
            <div className="card p-3 mb-3 flex items-center justify-between" role="status" aria-live="polite">
              <div className="text-sm">
                New version available. Current: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  const base = (import.meta as any).env.BASE_URL || '/'
                  const root = (base.startsWith('/') ? base : '/' + base).replace(/\/+$/, '/')
                  window.location.assign(root)
                }}
              >
                Update
              </button>
            </div>
          )}
          <Outlet />
        </main>
        {apk && <BottomNav activePath={location.pathname} />}
      </div>
    </ToastProvider>
  )
}
