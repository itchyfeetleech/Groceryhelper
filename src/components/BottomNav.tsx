import { Link } from 'react-router-dom'

export function BottomNav({ activePath }: { activePath: string }) {
  const items = [
    { to: '/recipes', label: 'Recipes', icon: RecipeIcon },
    { to: '/items', label: 'Items', icon: ItemsIcon },
    { to: '/groceries', label: 'Groceries', icon: ListIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
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

function RecipeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true"><path fill="currentColor" d="M2 2h16v2H2V2Zm1 5h14l-1.5 9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L3 7Zm4 2v7h2V9H7Zm4 0v7h2V9h-2Z"/></svg>
  )
}
function ItemsIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true"><path fill="currentColor" d="M3 3h14v4H3V3Zm0 6h14v4H3V9Zm0 6h14v2H3v-2Z"/></svg>
  )
}
function ListIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true"><path fill="currentColor" d="M2 4h2v2H2V4Zm4 0h12v2H6V4ZM2 9h2v2H2V9Zm4 0h12v2H6V9ZM2 14h2v2H2v-2Zm4 0h12v2H6v-2Z"/></svg>
  )
}
function SettingsIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true"><path fill="currentColor" d="M8.6 0h2.8l.4 2.3 2 .8 1.9-1.3 2 2-1.3 1.9.8 2 .2 1.1-2.8.5-.5-1.4-1.5-1.5-1.4-.5L9.8 8l.5 1.4 1.5 1.5 1.4.5.5 2.8-1.1.2-2 .8 1.3 1.9-2 2-1.9-1.3-2 .8L8.6 20H5.8l-.4-2.3-2-.8-1.9 1.3-2-2 1.3-1.9-.8-2L0 10.2l2.8-.5.5 1.4 1.5 1.5 1.4.5L10.2 12l-.5-1.4L8.2 9.1l-1.4-.5-.5-2.8 1.1-.2 2-.8L8.2 2.9l2-2 1.9 1.3 2-.8L11.4 0H8.6ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>
  )
}

