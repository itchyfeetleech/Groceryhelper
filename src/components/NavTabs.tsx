import { Link } from 'react-router-dom'

export function NavTabs({
  tabs,
  activePath,
}: {
  tabs: { to: string; label: string }[]
  activePath: string
}) {
  return (
    <nav aria-label="Primary">
      <ul className="flex gap-2">
        {tabs.map((t) => {
          const active = activePath.startsWith(t.to)
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={
                  'inline-flex items-center rounded-lg px-3 py-1.5 text-sm border shadow-sm transition-colors ' +
                  (active
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                }
                aria-current={active ? 'page' : undefined}
              >
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
