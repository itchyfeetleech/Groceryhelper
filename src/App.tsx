import { Outlet, Link, useLocation } from 'react-router-dom'
import { NavTabs } from './components/NavTabs'

export function App() {
  const location = useLocation()
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
