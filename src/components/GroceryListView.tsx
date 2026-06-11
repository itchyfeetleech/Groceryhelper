import { useEffect, useMemo, useRef, useState } from 'react'
import { List, type RowComponentProps } from 'react-window'
import { useSwipeable } from 'react-swipeable'
import { useStore } from '../state/store'
import { aggregateUnified, type AggregatedUnifiedItem } from '../utils/aggregate'
import { groupByCategory } from '../utils/categories'
import { CategorySelect } from './CategorySelect'
import { normalizeName } from '../utils/normalization'
import { useIsApk } from '../utils/apk'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { ProgressRing } from '../ui/ProgressRing'
import { useToast } from '../ui/Toast'
import { haptic } from '../utils/haptics'

const VIRTUALIZE_THRESHOLD = 120
const VIRTUAL_ROW_HEIGHT = 68
const GROUP_BY_AISLE_KEY = 'groupByAisle'

export function GroceryListView() {
  const apk = useIsApk()
  const {
    recipes,
    selectedRecipeIds,
    extras,
    checkedNames,
    categories,
    setItemCategory,
    replaceCheckedNames,
    toggleChecked,
    clearChecks,
    clearCurrentList,
    removeExtra,
    addExtra,
  } = useStore()
  const { show } = useToast()

  const agg = useMemo(
    () => aggregateUnified(recipes, selectedRecipeIds, extras, categories),
    [recipes, selectedRecipeIds, extras, categories],
  )
  const [extraName, setExtraName] = useState('')
  const [hideChecked, setHideChecked] = useState(false)
  const [groupByAisle, setGroupByAisle] = useState(() => {
    try {
      return localStorage.getItem(GROUP_BY_AISLE_KEY) !== '0'
    } catch {
      return true
    }
  })
  const toggleGroupByAisle = (on: boolean) => {
    setGroupByAisle(on)
    try {
      localStorage.setItem(GROUP_BY_AISLE_KEY, on ? '1' : '0')
    } catch {}
  }

  const addExtraItem = () => {
    const norm = normalizeName(extraName)
    if (!norm) return
    const duplicate = extras.some((e) => normalizeName(e.name) === norm && e.section === 'standard')
    if (duplicate) {
      show({ text: `"${extraName.trim()}" is already on the list` })
      return
    }
    addExtra({ name: extraName, section: 'standard', source: 'manual' })
    setExtraName('')
    if (apk) haptic('medium')
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
    if (pruned.length !== checkedNames.length || pruned.some((n, idx) => n !== checkedNames[idx])) {
      replaceCheckedNames(pruned)
    }
  }, [agg, checkedNames, replaceCheckedNames])

  const canRemove = (norm: string) => extras.some((e) => normalizeName(e.name) === norm && e.section === 'standard')

  const checkedSet = new Set(checkedNames)
  const remaining = agg.filter((i) => !checkedSet.has(i.norm))
  const completed = agg.filter((i) => checkedSet.has(i.norm))
  const totalCount = agg.length
  const remainingCount = remaining.length
  const animRemaining = useAnimatedNumber(remainingCount)
  const animTotal = useAnimatedNumber(totalCount)
  const progress = totalCount > 0 ? (totalCount - remainingCount) / totalCount : 0

  // Celebrate only when crossing the finish line, not on every recompute of a finished list
  const prevRemainingRef = useRef<number | null>(null)
  useEffect(() => {
    const prev = prevRemainingRef.current
    prevRemainingRef.current = remainingCount
    if (totalCount === 0 || remainingCount > 0 || prev === null || prev === 0) return
    if (apk) {
      haptic('heavy')
      import('canvas-confetti')
        .then((m) => m.default({ particleCount: 60, spread: 60, origin: { y: 0.8 } }))
        .catch(() => {})
    } else {
      show({ text: 'All done! 🎉' })
    }
  }, [apk, totalCount, remainingCount, show])

  const onToggle = (norm: string) => {
    toggleChecked(norm)
    haptic('light')
  }
  const onRemove = (norm: string) => {
    const extra = extras.find((e) => normalizeName(e.name) === norm && e.section === 'standard')
    removeExtra(norm, 'standard')
    haptic('medium')
    if (extra) {
      show({
        text: `Removed ${extra.name}`,
        actionLabel: 'Undo',
        onAction: () => addExtra({ name: extra.name, section: 'standard', source: extra.source ?? 'manual' }),
      })
    }
  }

  const onSetCategory = (norm: string, category: string | null) => setItemCategory(norm, category)

  const listEmpty = selectedRecipeIds.length === 0 && extras.length === 0
  const anyCategorized = agg.some((i) => i.category)
  const visibleItems = hideChecked ? remaining : agg

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
            className="flex-1 input"
            placeholder="e.g. Milk"
            aria-label="Add individual item"
            enterKeyHint="done"
          />
          <button className="btn-primary" onClick={addExtraItem} disabled={!extraName.trim()}>
            Add
          </button>
        </div>
      </section>

      <section>
        {totalCount > 0 && (
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <ProgressRing progress={progress} ariaLabel={`Progress ${Math.round(progress * 100)}%`} />
              <div>
                <span className="font-medium text-slate-800">{animRemaining}</span>
                {' '}of{' '}
                <span className="font-medium text-slate-800">{animTotal}</span> remaining
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={groupByAisle}
                  onChange={(e) => toggleGroupByAisle(e.target.checked)}
                  aria-label="Group by aisle"
                />
                <span>Group by aisle</span>
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={hideChecked}
                  onChange={(e) => setHideChecked(e.target.checked)}
                  aria-label="Hide checked items"
                />
                <span>Hide checked</span>
              </label>
            </div>
          </div>
        )}
        {groupByAisle && totalCount > 0 && !anyCategorized && (
          <p className="text-xs text-slate-500 mb-2">
            Tip: tap the &ldquo;No aisle&rdquo; tag on an item to organize the list by store aisle.
          </p>
        )}

        {groupByAisle && anyCategorized ? (
          <GroupedItems
            items={visibleItems}
            emptyText={
              listEmpty
                ? 'Nothing here yet. Pick recipes for the week or add items above.'
                : 'All items are checked off and hidden.'
            }
            checkedNames={checkedNames}
            onToggle={onToggle}
            onRemove={onRemove}
            canRemove={canRemove}
            onSetCategory={onSetCategory}
          />
        ) : (
          <Items
            items={visibleItems}
            emptyText={
              listEmpty
                ? 'Nothing here yet. Pick recipes for the week or add items above.'
                : 'All items are checked off and hidden.'
            }
            checkedNames={checkedNames}
            onToggle={onToggle}
            onRemove={onRemove}
            canRemove={canRemove}
            onSetCategory={onSetCategory}
            allowVirtualize={!apk}
          />
        )}

        {hideChecked && completed.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-700">Completed ({completed.length})</summary>
            <div className="mt-2">
              <Items
                items={completed}
                emptyText=""
                checkedNames={checkedNames}
                onToggle={onToggle}
                onRemove={onRemove}
                canRemove={canRemove}
                onSetCategory={onSetCategory}
                allowVirtualize={!apk}
              />
            </div>
          </details>
        )}
      </section>

      <div className="flex items-center gap-2">
        <button className="btn" onClick={clearChecks} disabled={checkedNames.length === 0}>
          Clear checks
        </button>
        <button
          className="btn-danger"
          disabled={listEmpty && checkedNames.length === 0}
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
    </div>
  )
}

type ItemCallbacks = {
  checkedNames: string[]
  onToggle: (norm: string) => void
  onRemove: (norm: string) => void
  canRemove: (norm: string) => boolean
  onSetCategory: (norm: string, category: string | null) => void
}

function GroupedItems({
  items,
  emptyText,
  ...callbacks
}: ItemCallbacks & {
  items: AggregatedUnifiedItem[]
  emptyText: string
}) {
  if (items.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>
  const groups = groupByCategory(items)
  return (
    <div>
      {groups.map((g) => (
        <section key={g.category ?? '__none'} className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            {g.category ?? 'No aisle'} <span className="font-normal">({g.items.length})</span>
          </h3>
          <ul className="space-y-2" aria-label={`${g.category ?? 'No aisle'} items`}>
            {g.items.map((it) => (
              <li key={it.norm}>
                <ItemCard
                  item={it}
                  checked={callbacks.checkedNames.includes(it.norm)}
                  onToggle={callbacks.onToggle}
                  onRemove={callbacks.onRemove}
                  removable={callbacks.canRemove(it.norm)}
                  onSetCategory={callbacks.onSetCategory}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Items({
  items,
  emptyText,
  checkedNames,
  onToggle,
  onRemove,
  canRemove,
  onSetCategory,
  allowVirtualize,
}: ItemCallbacks & {
  items: AggregatedUnifiedItem[]
  emptyText: string
  allowVirtualize: boolean
}) {
  // Once virtualized, stay virtualized to avoid flip-flopping around the threshold
  const [everVirtual, setEverVirtual] = useState(items.length > VIRTUALIZE_THRESHOLD)
  useEffect(() => {
    if (items.length > VIRTUALIZE_THRESHOLD) setEverVirtual(true)
  }, [items.length])

  if (items.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>

  // Virtualization is disabled in APK mode so native scrolling works well in the TWA
  if (allowVirtualize && everVirtual) {
    return (
      <VirtualizedItems
        items={items}
        checkedNames={checkedNames}
        onToggle={onToggle}
        onRemove={onRemove}
        canRemove={canRemove}
        onSetCategory={onSetCategory}
      />
    )
  }

  return (
    <ul className="space-y-2" aria-label="Grocery items">
      {items.map((it) => (
        <li key={it.norm}>
          <ItemCard
            item={it}
            checked={checkedNames.includes(it.norm)}
            onToggle={onToggle}
            onRemove={onRemove}
            removable={canRemove(it.norm)}
            onSetCategory={onSetCategory}
          />
        </li>
      ))}
    </ul>
  )
}

type VirtualRowProps = ItemCallbacks & { items: AggregatedUnifiedItem[] }

function VirtualRow({
  index,
  style,
  items,
  checkedNames,
  onToggle,
  onRemove,
  canRemove,
  onSetCategory,
}: RowComponentProps<VirtualRowProps>) {
  const it = items[index]
  if (!it) return null
  return (
    <div style={style} className="py-1 px-0.5">
      <ItemCard
        item={it}
        checked={checkedNames.includes(it.norm)}
        onToggle={onToggle}
        onRemove={onRemove}
        removable={canRemove(it.norm)}
        onSetCategory={onSetCategory}
      />
    </div>
  )
}

function VirtualizedItems({ items, ...callbacks }: ItemCallbacks & { items: AggregatedUnifiedItem[] }) {
  const height = Math.max(320, Math.min(680, Math.round(window.innerHeight * 0.7)))
  return (
    <List
      style={{ height }}
      role="list"
      aria-label="Grocery items"
      rowComponent={VirtualRow}
      rowCount={items.length}
      rowHeight={VIRTUAL_ROW_HEIGHT}
      rowProps={{ items, ...callbacks }}
      overscanCount={6}
    />
  )
}

function ItemCard({
  item: it,
  checked,
  onToggle,
  onRemove,
  removable,
  onSetCategory,
}: {
  item: AggregatedUnifiedItem
  checked: boolean
  onToggle: (norm: string) => void
  onRemove: (norm: string) => void
  removable: boolean
  onSetCategory: (norm: string, category: string | null) => void
}) {
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (removable) onRemove(it.norm)
    },
    onSwipedRight: () => onToggle(it.norm),
    preventScrollOnSwipe: false,
    delta: 35,
    trackTouch: true,
    touchEventOptions: { passive: true },
  })
  const label = it.count > 1 ? `${it.name} ×${it.count}` : it.name
  return (
    <div
      {...handlers}
      className={
        'flex items-center justify-between flex-wrap gap-x-3 gap-y-1 card px-3 py-2 transition-shadow ' +
        (checked ? 'opacity-80' : 'hover:shadow-md')
      }
    >
      <label className="flex items-center gap-2 min-w-0 flex-1 basis-40 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={() => onToggle(it.norm)} aria-label={`Check ${it.name}`} />
        <span className={checked ? 'line-through text-slate-500 truncate' : 'truncate'} title={label}>
          {label}
        </span>
      </label>
      <div className="flex items-center gap-2 ml-auto">
        <SourceBadges sources={it.sources} />
        <CategorySelect value={it.category} onChange={(c) => onSetCategory(it.norm, c)} itemName={it.name} />
        {removable && (
          <button
            className="btn-icon btn-icon-danger"
            onClick={() => onRemove(it.norm)}
            aria-label={`Remove extra ${it.name}`}
            title={`Remove ${it.name}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 7h12M9 7l1-2h4l1 2M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            <span className="sr-only">Remove</span>
          </button>
        )}
      </div>
    </div>
  )
}

function SourceBadges({ sources }: { sources: AggregatedUnifiedItem['sources'] }) {
  const shown = sources.recipeNames.slice(0, 2)
  const hidden = sources.recipeNames.length - shown.length
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {sources.standard && (
        <span className="text-[12px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
          Standard
        </span>
      )}
      {sources.special && (
        <span className="text-[12px] px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">
          Special
        </span>
      )}
      {sources.fromFavourite && (
        <span className="text-[12px] px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900">
          Favourite
        </span>
      )}
      {shown.map((n) => (
        <span
          key={n}
          className="text-[12px] px-1.5 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-900"
          title={`From recipe: ${n}`}
        >
          {n}
        </span>
      ))}
      {hidden > 0 && (
        <span
          className="text-[12px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-300 text-blue-900"
          title={sources.recipeNames.join(', ')}
          aria-label={`From recipes: ${sources.recipeNames.join(', ')}`}
        >
          +{hidden} recipes
        </span>
      )}
    </div>
  )
}
