import { normalizeName } from '../utils/normalization'

type Props = {
  items: string[]
  onDelete: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

export function IngredientChips({ items, onDelete, onMoveUp, onMoveDown }: Props) {
  if (!items.length) return <p className="text-sm muted">No ingredients.</p>
  return (
    <ul className="flex flex-wrap gap-2" aria-live="polite">
      {items.map((ing, i) => (
        <li
          key={`${normalizeName(ing)}-${i}`}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-3 pr-1 shadow-sm"
        >
          <span className="text-sm text-soft">{ing}</span>
          <div className="flex gap-0.5">
            <button
              type="button"
              className="chip-btn"
              aria-label={`Move ${ing} up`}
              onClick={() => onMoveUp(i)}
              disabled={i === 0}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5l-5 5M12 5l5 5M12 5v14"/>
              </svg>
            </button>
            <button
              type="button"
              className="chip-btn"
              aria-label={`Move ${ing} down`}
              onClick={() => onMoveDown(i)}
              disabled={i === items.length - 1}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l-5-5M12 19l5-5M12 19V5"/>
              </svg>
            </button>
            <button type="button" className="chip-btn chip-btn-danger" aria-label={`Remove ${ing}`} onClick={() => onDelete(i)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
