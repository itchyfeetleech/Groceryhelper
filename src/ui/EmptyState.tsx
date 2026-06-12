import React from 'react'

/** Friendly placeholder for empty lists: dashed card with a basket mark. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 10h16l-1.2 8a3 3 0 0 1-3 3H8.2a3 3 0 0 1-3-3L4 10Z" />
        <path d="M9 10l3-5 3 5" />
        <path d="M10 14v4M14 14v4" />
      </svg>
      <p>{children}</p>
    </div>
  )
}
