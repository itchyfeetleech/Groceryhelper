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
            <button
              type="button"
              className="btn-icon disabled:opacity-50"
              aria-label={`Move ${ing} up`}
              onClick={() => onMoveUp(i)}
              disabled={i === 0}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current"><path d="M10 4l6 6H4l6-6Zm0 12H4v-2h12v2H10Z"/></svg>
            </button>
            <button
              type="button"
              className="btn-icon disabled:opacity-50"
              aria-label={`Move ${ing} down`}
              onClick={() => onMoveDown(i)}
              disabled={i === items.length - 1}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current"><path d="M10 16l-6-6h12l-6 6ZM10 4h6v2H4V4h6Z"/></svg>
            </button>
            <button
              type="button"
              className="btn-icon btn-icon-danger"
              aria-label={`Remove ${ing}`}
              onClick={() => onDelete(i)}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current"><path d="M6 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h4v2H0V2h6Zm2 18a2 2 0 0 1-2-2V6h12v12a2 2 0 0 1-2 2H8Zm2-10h2v8h-2v-8Zm6 0h-2v8h2v-8ZM8 10H6v8h2v-8Z"/></svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
