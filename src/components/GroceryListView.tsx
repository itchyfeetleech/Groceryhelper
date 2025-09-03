import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../state/store'
import { aggregate } from '../utils/aggregate'
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
  } = useStore()

  const agg = useMemo(() => aggregate(recipes, selectedRecipeIds, extras), [recipes, selectedRecipeIds, extras])

  // Announce recomputes
  const liveRef = useRef<HTMLDivElement>(null)
  const countsText = `Standard ${agg.standard.length} • Special ${agg.special.length}`
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = `List updated. ${countsText}`
  }, [countsText])

  // Prune checks that no longer exist after recompute
  useEffect(() => {
    const available = new Set([...agg.standard, ...agg.special].map((i) => i.norm))
    const pruned = checkedNames.filter((n) => available.has(n))
    if (pruned.length !== checkedNames.length) {
      // Update silently
      (useStore as any).setState({ checkedNames: pruned })
    }
  }, [agg.standard, agg.special])

  const canRemove = (norm: string, section: 'standard' | 'special') =>
    extras.some((e) => normalizeName(e.name) === norm && e.section === section)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <h2 className="font-medium mb-2">Standard</h2>
        <Items
          items={agg.standard}
          checkedNames={checkedNames}
          onToggle={toggleChecked}
          onRemove={(norm) => removeExtra(norm, 'standard')}
          canRemove={(norm) => canRemove(norm, 'standard')}
        />
      </section>
      <section>
        <h2 className="font-medium mb-2">Special</h2>
        <Items
          items={agg.special}
          checkedNames={checkedNames}
          onToggle={toggleChecked}
          onRemove={(norm) => removeExtra(norm, 'special')}
          canRemove={(norm) => canRemove(norm, 'special')}
        />
      </section>
      <div className="col-span-full flex items-center gap-2">
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
  items: { norm: string; name: string; count: number }[]
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
          <li key={it.norm} className="flex items-center justify-between gap-2 bg-white border rounded px-3 py-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={checked} onChange={() => onToggle(it.norm)} aria-label={`Check ${it.name}`} />
              <span className={checked ? 'line-through text-slate-500' : ''}>{it.name} × {it.count}</span>
            </label>
            {canRemove(it.norm) && (
              <button
                className="px-2 py-1 rounded border border-red-300 text-red-700"
                onClick={() => onRemove(it.norm)}
                aria-label={`Remove extra ${it.name}`}
              >Remove extra</button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
