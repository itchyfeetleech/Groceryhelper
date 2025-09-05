import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { aggregateUnified } from '../utils/aggregate'
import { normalizeName } from '../utils/normalization'

export function GroceryListView() {
  const {
    recipes,
    selectedRecipeIds,
    extras,
    checkedNames,
    toggleChecked,
    clearChecks,
    removeExtra,
    addExtra,
  } = useStore()

  const agg = useMemo(() => aggregateUnified(recipes, selectedRecipeIds, extras), [recipes, selectedRecipeIds, extras])
  const [extraName, setExtraName] = useState('')
  const addExtraItem = () => {
    const n = normalizeName(extraName)
    if (!n) return
    addExtra({ name: extraName, section: 'standard', source: 'manual' })
    setExtraName('')
  }

  // Announce recomputes
  const liveRef = useRef<HTMLDivElement>(null)
  const countsText = `Items ${agg.length}`
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = `List updated. ${countsText}`
  }, [countsText])

  // Prune checks that no longer exist after recompute
  useEffect(() => {
    const available = new Set(agg.map((i) => i.norm))
    const pruned = checkedNames.filter((n) => available.has(n))
    if (pruned.length !== checkedNames.length) {
      // Update silently
      ;(useStore as any).setState({ checkedNames: pruned })
    }
  }, [agg])

  const canRemove = (norm: string) => extras.some((e) => normalizeName(e.name) === norm && e.section === 'standard')

  return (
    <div className="space-y-4">
      <section>
        <h2 className="font-medium mb-2">Add individual item</h2>
        <div className="flex gap-2">
          <input
            value={extraName}
            onChange={(e) => setExtraName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addExtraItem()
              }
            }}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Add item (standard)"
            aria-label="Add individual item"
          />
          <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={addExtraItem}>Add</button>
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-2">Grocery list</h2>
        <Items
          items={agg}
          checkedNames={checkedNames}
          onToggle={toggleChecked}
          onRemove={(norm) => removeExtra(norm, 'standard')}
          canRemove={(norm) => canRemove(norm)}
        />
      </section>

      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded border" onClick={clearChecks}>Clear checks</button>
        <div ref={liveRef} aria-live="polite" className="sr-only" />
      </div>
    </div>
  )
}

function Items({
  items,
  checkedNames,
  onToggle,
  onRemove,
  canRemove,
}: {
  items: { norm: string; name: string; count: number; sources: { standard: boolean; special: boolean; fromFavourite: boolean; recipeNames: string[] } }[]
  checkedNames: string[]
  onToggle: (norm: string) => void
  onRemove: (norm: string) => void
  canRemove: (norm: string) => boolean
}) {
  if (items.length === 0) return <p className="text-sm text-slate-500">No items.</p>
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const checked = checkedNames.includes(it.norm)
        return (
          <li key={it.norm} className="flex items-center justify-between gap-3 bg-white border rounded px-3 py-2">
            <label className="flex items-center gap-2 min-w-0">
              <input type="checkbox" checked={checked} onChange={() => onToggle(it.norm)} aria-label={`Check ${it.name}`} />
              <span className={checked ? 'line-through text-slate-500 truncate' : 'truncate'} title={`${it.name} x ${it.count}`}>
                {it.name} x {it.count}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 justify-end">
                {it.sources.standard && <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 border">Standard</span>}
                {it.sources.special && <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 border">Special</span>}
                {it.sources.fromFavourite && <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-100 border">Favourite</span>}
                {it.sources.recipeNames.map((n) => (
                  <span key={n} className="text-[10px] px-1 py-0.5 rounded bg-blue-100 border">{n}</span>
                ))}
              </div>
              {canRemove(it.norm) && (
                <button
                  className="px-2 py-1 rounded border border-red-300 text-red-700"
                  onClick={() => onRemove(it.norm)}
                  aria-label={`Remove extra ${it.name}`}
                >Remove</button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
