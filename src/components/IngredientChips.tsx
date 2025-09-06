import { normalizeName } from '../utils/normalization'

type Props = {
  items: string[]
  onDelete: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

export function IngredientChips({ items, onDelete, onMoveUp, onMoveDown }: Props) {
  if (!items.length) return <p className="text-sm text-slate-500">No ingredients.</p>
  return (
    <ul className="flex flex-wrap gap-2" aria-live="polite">
      {items.map((ing, i) => (
        <li key={`${normalizeName(ing)}-${i}`} className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
          <span className="text-sm">{ing}</span>
          <div className="flex gap-1">
            <button type="button" className="btn-icon disabled:opacity-50" aria-label={`Move ${ing} up`} onClick={() => onMoveUp(i)} disabled={i === 0}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5l-5 5M12 5l5 5M12 5v14"/>
              </svg>
            </button>
            <button type="button" className="btn-icon disabled:opacity-50" aria-label={`Move ${ing} down`} onClick={() => onMoveDown(i)} disabled={i === items.length - 1}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l-5-5M12 19l5-5M12 19V5"/>
              </svg>
            </button>
            <button type="button" className="btn-icon btn-icon-danger" aria-label={`Remove ${ing}`} onClick={() => onDelete(i)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 7h12M9 7l1-2h4l1 2M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
