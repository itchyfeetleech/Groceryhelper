import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { aggregateUnified } from '../utils/aggregate'
import { normalizeName } from '../utils/normalization'
import { useIsApk } from '../utils/apk'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { ProgressRing } from '../ui/ProgressRing'
import { useToast } from '../ui/Toast'
import { haptic } from '../utils/haptics'
import { useSwipeable } from 'react-swipeable'
// react-window is dynamically imported in virtualized branch to avoid build export issues

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
  const animRemaining = useAnimatedNumber(remainingCount)
  const animTotal = useAnimatedNumber(totalCount)
  const progress = totalCount > 0 ? (totalCount - remainingCount) / totalCount : 0
  const { show } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [virtualize, setVirtualize] = useState(false)
  useEffect(() => {
    if (!virtualize && totalCount > 120) setVirtualize(true)
  }, [totalCount, virtualize])

  // Celebrate when finished
  useEffect(() => {
    if (totalCount > 0 && remainingCount === 0) {
      if (apk) {
        haptic('heavy')
        import('canvas-confetti')
          .then((m) => m.default({ particleCount: 60, spread: 60, origin: { y: 0.8 } }))
          .catch(() => {})
      } else {
        show({ text: 'All done! 🎉' })
      }
    }
  }, [apk, totalCount, remainingCount])

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
                if (apk) haptic('medium')
              }
            }}
            className="flex-1 input"
            placeholder="Add item (standard)"
            aria-label="Add individual item"
            enterKeyHint="done"
          />
          <button
            className="btn-primary"
            onClick={() => { addExtraItem(); if (apk) haptic('medium') }}
            disabled={!extraName.trim()}
          >
            Add
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-2 hidden md:block">Grocery list</h2>
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <ProgressRing progress={progress} ariaLabel={`Progress ${Math.round(progress * 100)}%`} />
            <div>
              <span className="font-medium text-slate-800">{animRemaining}</span>
              {' '}of{' '}
              <span className="font-medium text-slate-800">{animTotal}</span> remaining
            </div>
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
            haptic('light')
          }}
          onRemove={(norm) => {
            // Try to find an extra to allow undo
            const extra = extras.find((e) => normalizeName(e.name) === norm && e.section === 'standard')
            removeExtra(norm, 'standard')
            haptic('medium')
            if (extra) {
              show({ text: `Removed ${extra.name}`, actionLabel: 'Undo', onAction: () => addExtra({ name: extra.name, section: 'standard', source: 'manual' }) })
            }
          }}
          canRemove={(norm) => canRemove(norm)}
          apk={apk}
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
                apk={apk}
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
      {/* Bottom add bar removed for APK to simplify and avoid overlay issues */}
    </div>
  )
}

function Items({
  items,
  checkedNames,
  onToggle,
  onRemove,
  canRemove,
  apk,
}: {
  items: { norm: string; name: string; count: number; sources: { standard: boolean; special: boolean; fromFavourite: boolean; recipeNames: string[] } }[]
  checkedNames: string[]
  onToggle: (norm: string) => void
  onRemove: (norm: string) => void
  canRemove: (norm: string) => boolean
  apk: boolean
}) {
  if (items.length === 0) return <p className="text-sm text-slate-500">No items.</p>
  // Stabilize virtualization to avoid toggling around the threshold
  const [everVirtual, setEverVirtual] = useState(items.length > 120)
  useEffect(() => { if (items.length > 120) setEverVirtual(true) }, [items.length])
  // Disable virtualization in APK mode to ensure native scrolling works well in TWA
  const shouldVirtualize = !apk && everVirtual
  if (shouldVirtualize) {
    const Row = ({ index, style }: { index: number; style: any }) => {
      const it = items[index]
      const checked = checkedNames.includes(it.norm)
      const handlers = useSwipeable({
        onSwipedLeft: () => { if (canRemove(it.norm)) onRemove(it.norm) },
        onSwipedRight: () => onToggle(it.norm),
        preventScrollOnSwipe: false,
        delta: 35,
        trackTouch: true,
        touchEventOptions: { passive: true },
      })
      return (
        <div style={style} {...handlers}>
          <div className={'flex items-center justify-between gap-3 card px-3 py-2 mx-0.5 my-1 transition-shadow ' + (checked ? 'opacity-80' : 'hover:shadow-md')}>
            <label className="flex items-center gap-2 min-w-0 cursor-pointer">
              <input type="checkbox" checked={checked} onChange={() => onToggle(it.norm)} aria-label={`Check ${it.name}`} />
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
                        <span className="text-[12px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-300 text-blue-900" title={names.join(', ')} aria-label={`From recipes: ${names.join(', ')}`}>
                          +{hidden} recipes
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
              {canRemove(it.norm) && (
                <button className="btn-icon btn-icon-danger" onClick={() => onRemove(it.norm)} aria-label={`Remove extra ${it.name}`} title={`Remove ${it.name}`}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 7h12M9 7l1-2h4l1 2M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                  <span className="sr-only">Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }
    // Use a safe height to avoid layout thrash; fixed item size generous to prevent clipping of badges
    const height = Math.max(320, Math.min(680, Math.round(window.innerHeight * 0.7)))
    const itemSize = 68
    const [VListMod, setVListMod] = useState<any>(null)
    useEffect(() => {
      let mounted = true
      import('react-window')
        .then((m) => { if (mounted) setVListMod((m as any).FixedSizeList || (m as any).default?.FixedSizeList) })
        .catch(() => { if (mounted) setVListMod(null) })
      return () => { mounted = false }
    }, [])
    if (!VListMod) {
      // Fallback to simple list until module loads
      return (
        <ul className="space-y-2" aria-label="Grocery items">
          {items.map((it) => (
            <ListItem
              key={it.norm}
              item={it}
              checked={checkedNames.includes(it.norm)}
              onToggle={onToggle}
              onRemove={onRemove}
              canRemove={canRemove}
            />
          ))}
        </ul>
      )
    }
    const VList = VListMod
    return (
      <div role="list" aria-label="Grocery items (virtualized)">
        <VList height={height} itemCount={items.length} itemSize={itemSize} width={'100%'} overscanCount={6}>
          {Row as any}
        </VList>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <ListItem
          key={it.norm}
          item={it}
          checked={checkedNames.includes(it.norm)}
          onToggle={onToggle}
          onRemove={onRemove}
          canRemove={canRemove}
        />
      ))}
    </ul>
  )
}

function ListItem({
  item: it,
  checked,
  onToggle,
  onRemove,
  canRemove,
}: {
  item: { norm: string; name: string; count: number; sources: { standard: boolean; special: boolean; fromFavourite: boolean; recipeNames: string[] } }
  checked: boolean
  onToggle: (norm: string) => void
  onRemove: (norm: string) => void
  canRemove: (norm: string) => boolean
}) {
  const handlers = useSwipeable({
    onSwipedLeft: () => { if (canRemove(it.norm)) onRemove(it.norm) },
    onSwipedRight: () => onToggle(it.norm),
    preventScrollOnSwipe: false,
    delta: 35,
    trackTouch: true,
    touchEventOptions: { passive: true },
  })
  return (
    <li className={'flex items-center justify-between gap-3 card px-3 py-2 transition-shadow ' + (checked ? 'opacity-80' : 'hover:shadow-md')} {...handlers}>
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
          <button className="btn-icon btn-icon-danger" onClick={() => onRemove(it.norm)} aria-label={`Remove extra ${it.name}`} title={`Remove ${it.name}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7h12M9 7l1-2h4l1 2M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            <span className="sr-only">Remove</span>
          </button>
        )}
      </div>
    </li>
  )
}
