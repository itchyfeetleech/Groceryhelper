import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { aggregateUnified } from '../utils/aggregate'
import { normalizeName } from '../utils/normalization'
import { useIsApk } from '../utils/apk'

export function GroceryListView() {
  const apk = useIsApk()
  const {
    recipes,
    selectedRecipeIds,
    extras,
    checkedNames,
    toggleChecked,
    clearChecks,
    clearCurrentList,
    removeExtra,
    addExtra,
  } = useStore()

  const agg = useMemo(() => aggregateUnified(recipes, selectedRecipeIds, extras), [recipes, selectedRecipeIds, extras])
  const [extraName, setExtraName] = useState('')
  const [hideChecked, setHideChecked] = useState(false)
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

  const checkedSet = new Set(checkedNames)
  const remaining = agg.filter((i) => !checkedSet.has(i.norm))
  const completed = agg.filter((i) => checkedSet.has(i.norm))
  const totalCount = agg.length
  const remainingCount = remaining.length

  return (
    <div className="space-y-4">
      {!apk && (
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
              className="flex-1 input"
              placeholder="Add item (standard)"
              aria-label="Add individual item"
            />
            <button
              className="btn-primary"
              onClick={addExtraItem}
              disabled={!extraName.trim()}
            >
              Add
            </button>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-medium mb-2">Grocery list</h2>
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="text-slate-600">
            <span className="font-medium text-slate-800">{remainingCount}</span> of <span className="font-medium text-slate-800">{totalCount}</span> remaining
          </div>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={hideChecked} onChange={(e) => setHideChecked(e.target.checked)} aria-label="Hide checked items" />
            <span>Hide checked</span>
          </label>
        </div>

        <Items
          items={hideChecked ? remaining : agg}
          checkedNames={checkedNames}
          onToggle={(norm) => {
            toggleChecked(norm)
            try { if (apk && 'vibrate' in navigator) (navigator as any).vibrate(10) } catch {}
          }}
          onRemove={(norm) => removeExtra(norm, 'standard')}
          canRemove={(norm) => canRemove(norm)}
        />

        {hideChecked && completed.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-700">Completed ({completed.length})</summary>
            <div className="mt-2">
              <Items
                items={completed}
                checkedNames={checkedNames}
                onToggle={(norm) => {
                  toggleChecked(norm)
                  try { if (apk && 'vibrate' in navigator) (navigator as any).vibrate(10) } catch {}
                }}
                onRemove={(norm) => removeExtra(norm, 'standard')}
                canRemove={(norm) => canRemove(norm)}
              />
            </div>
          </details>
        )}
      </section>

      <div className="flex items-center gap-2">
        <button className="btn" onClick={clearChecks}>Clear checks</button>
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm('Clear the current list? This removes selected recipes, extras, and checks.')) {
              clearCurrentList()
            }
          }}
        >
          Clear list
        </button>
        <div ref={liveRef} aria-live="polite" className="sr-only" />
      </div>
      {apk && (
        <div className="apk-addbar">
          <input
            value={extraName}
            onChange={(e) => setExtraName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtraItem() } }}
            className="apk-addbar-input"
            placeholder="Add item"
            aria-label="Add individual item (APK)"
          />
          <button className="apk-addbar-btn" onClick={addExtraItem} disabled={!extraName.trim()}>Add</button>
        </div>
      )}
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
          <li key={it.norm} className={
            'flex items-center justify-between gap-3 card px-3 py-2 transition-shadow ' +
            (checked ? 'opacity-80' : 'hover:shadow-md')
          }>
            <label className="flex items-center gap-2 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(it.norm)}
                aria-label={`Check ${it.name}`}
              />
              <span className={checked ? 'line-through text-slate-500 truncate' : 'truncate'} title={`${it.name} x ${it.count}`}>
                {it.name} x {it.count}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 justify-end">
                {it.sources.standard && (
                  <span className="text-[12px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">Standard</span>
                )}
                {it.sources.special && (
                  <span className="text-[12px] px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">Special</span>
                )}
                {it.sources.fromFavourite && (
                  <span className="text-[12px] px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900">Favourite</span>
                )}
                {/* Recipe origins: show up to 2, then +N with tooltip */}
                {(() => {
                  const names = it.sources.recipeNames
                  const shown = names.slice(0, 2)
                  const hidden = names.length - shown.length
                  return (
                    <>
                      {shown.map((n) => (
                        <span key={n} className="text-[12px] px-1.5 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-900" title={`From recipe: ${n}`}>
                          {n}
                        </span>
                      ))}
                      {hidden > 0 && (
                        <span
                          className="text-[12px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-300 text-blue-900"
                          title={names.join(', ')}
                          aria-label={`From recipes: ${names.join(', ')}`}
                        >
                          +{hidden} recipes
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
              {canRemove(it.norm) && (
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => onRemove(it.norm)}
                  aria-label={`Remove extra ${it.name}`}
                  title={`Remove ${it.name}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M6 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h4v2H0V2h6Zm2 18a2 2 0 0 1-2-2V6h12v12a2 2 0 0 1-2 2H8Zm2-10h2v8h-2v-8Zm6 0h-2v8h2v-8ZM8 10H6v8h2v-8Z"/></svg>
                  <span className="sr-only">Remove</span>
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
