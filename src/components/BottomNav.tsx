import { Link } from 'react-router-dom'

export function BottomNav({ activePath }: { activePath: string }) {
  const items = [
    { to: '/recipes', label: 'Recipes', icon: FireBookIcon },
    { to: '/items', label: 'Items', icon: BasketIcon },
    { to: '/groceries', label: 'Groceries', icon: ChecklistIcon },
    { to: '/settings', label: 'Settings', icon: GearIcon },
  ]
  return (
    <nav className="apk-bottom-nav" aria-label="Primary">
      <ul className="flex justify-around">
        {items.map((i) => {
          const active = activePath.startsWith(i.to)
          const Icon = i.icon
          return (
            <li key={i.to}>
              <Link to={i.to} className={active ? 'apk-nav-link active' : 'apk-nav-link'} aria-current={active ? 'page' : undefined}>
                <Icon className="w-6 h-6" />
                <span className="text-[12px]">{i.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function svg(props: React.SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} /> }

function FireBookIcon({ className = '' }) {
  return svg({ className, children: (
    <>
      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/>
      <path d="M5 17h12"/>
      <path d="M13.5 9.5c1-1.2 2.8-1.2 3.8 0 1 1.1.7 2.8-.4 3.8l-3.4 3.2-.3-.3"/>
    </>
  ) })
}
function BasketIcon({ className = '' }) {
  return svg({ className, children: (
    <>
      <path d="M4 10h16l-1.2 8a3 3 0 0 1-3 3H8.2a3 3 0 0 1-3-3L4 10Z"/>
      <path d="M9 10l3-5 3 5"/>
      <path d="M10 14v4M14 14v4"/>
    </>
  ) })
}
function ChecklistIcon({ className = '' }) {
  return svg({ className, children: (
    <>
      <path d="M4 6h10"/>
      <path d="M4 12h10"/>
      <path d="M4 18h10"/>
      <path d="M17 5l2 2 3-3"/>
      <path d="M17 11l2 2 3-3"/>
    </>
  ) })
}
function GearIcon({ className = '' }) {
  return svg({ className, children: (
    <>
      <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/>
      <path d="M4.9 8.6l-1.4-2.4 2.1-2.1 2.4 1.4M19.1 8.6l1.4-2.4-2.1-2.1-2.4 1.4"/>
      <path d="M19.1 15.4l1.4 2.4-2.1 2.1-2.4-1.4M4.9 15.4l-1.4 2.4 2.1 2.1 2.4-1.4"/>
    </>
  ) })
}

