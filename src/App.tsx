import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { initFirebaseSync } from './sync'
import { useStore } from './state/store'
import { saveStorage } from './utils/storage'
import { NavTabs } from './components/NavTabs'
import { BottomNav } from './components/BottomNav'
import { detectApkAndPersist, useIsApk } from './utils/apk'
import { ToastProvider } from './ui/Toast'
import { useSwipeable } from 'react-swipeable'

const ROUTES = ['/recipes', '/items', '/groceries', '/settings']

export function App() {
  const location = useLocation()
  const apk = useIsApk()
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Detect APK (TWA) and annotate document
    detectApkAndPersist()
    initFirebaseSync({
      getLocalData: () => {
        const s = useStore.getState()
        return { schemaVersion: 1, recipes: s.recipes, savedLists: s.savedLists, favourites: s.favourites }
      },
      onRemoteData: (data) => {
        useStore.getState().hydrateFromExternal(data)
        const state = useStore.getState()
        saveStorage({
          schemaVersion: 1,
          recipes: state.recipes,
          savedLists: state.savedLists,
          favourites: state.favourites,
        })
      },
    })
  }, [])

  // Poll for new deployed version and prompt to refresh
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const url = base.replace(/\/$/, '/') + 'version.txt?ts=' + Date.now()
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const txt = (await res.text()).trim()
        // Guard against SPA fallbacks serving index.html instead of a version string
        const looksLikeVersion = txt.length > 0 && txt.length < 64 && !txt.includes('<') && !txt.includes('\n')
        if (looksLikeVersion && typeof __APP_VERSION__ !== 'undefined' && txt !== __APP_VERSION__) {
          if (!cancelled) setUpdateAvailable(true)
        }
      } catch {
        // offline or version file missing; try again later
      }
    }
    check()
    const id = setInterval(check, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const navigate = useNavigate()
  const idx = ROUTES.findIndex((r) => location.pathname.startsWith(r))
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const next = idx >= 0 ? ROUTES[idx + 1] : undefined
      if (apk && next) navigate(next)
    },
    onSwipedRight: () => {
      const prev = idx > 0 ? ROUTES[idx - 1] : undefined
      if (apk && prev) navigate(prev)
    },
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
        <header
          className={
            (scrolled ? 'shadow-sm ' : '') +
            'app-header border-b bg-white/80 backdrop-blur sticky top-0 z-20 hidden md:block'
          }
        >
          <div className="container py-3 flex items-center gap-4">
            <Link to="/recipes" className="font-semibold text-lg">
              Grocery Helper
            </Link>
            <NavTabs
              tabs={[
                { to: '/recipes', label: 'Recipes' },
                { to: '/items', label: 'Items' },
                { to: '/groceries', label: 'Grocery list' },
                { to: '/settings', label: 'Settings' },
              ]}
              activePath={location.pathname}
            />
          </div>
        </header>
        <main className={apk ? 'container py-3 has-bottom-nav' : 'container py-4 has-bottom-nav'}>
          {updateAvailable && (
            <div className="card p-3 mb-3 flex items-center justify-between gap-3" role="status" aria-live="polite">
              <div className="text-sm">
                New version available. Current: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-primary"
                  onClick={() => {
                    const base = import.meta.env.BASE_URL || '/'
                    const root = (base.startsWith('/') ? base : '/' + base).replace(/\/+$/, '/')
                    window.location.assign(root)
                  }}
                >
                  Update
                </button>
                <button className="btn" onClick={() => setUpdateAvailable(false)} aria-label="Dismiss update notice">
                  Later
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
        {/* Bottom navigation: always in APK mode; on small screens for everyone (the header is hidden below md) */}
        <div className={apk ? undefined : 'md:hidden'}>
          <BottomNav activePath={location.pathname} />
        </div>
      </div>
    </ToastProvider>
  )
}
