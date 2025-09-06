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
                  'inline-flex items-center rounded-md px-3 py-1.5 text-sm border ' +
                  (active
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50')
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
