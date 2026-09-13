import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GearIcon } from '../components/BottomNav'

export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="page-title">{children}</h1>
      <Link to="/settings" className="btn-icon shrink-0" aria-label="Settings" title="Settings">
        <GearIcon className="w-5 h-5" />
      </Link>
    </div>
  )
}
