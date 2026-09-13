import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { normalizeName } from '../utils/normalization'
import { useToast } from '../ui/Toast'
import { CategorySelect } from './CategorySelect'
import { autoAisle, NO_AISLE, resolveAisle } from '../utils/aisleDb'
import { groupByCategory } from '../utils/categories'
import { EmptyState } from '../ui/EmptyState'

export function FavouritesPanel() {
  const { favourites, extras, addFavourite, removeFavourite, addExtra, removeExtra, categories, setItemCategory } =
    useStore()
  const { show } = useToast()
  const [favName, setFavName] = useState('')

  const extrasSet = useMemo(() => {
    return new Set(
      extras.map((e) => `${e.section}:${normalizeName(e.name)}`)
    )
  }, [extras])

  const addFav = () => {
    const n = normalizeName(favName)
    if (!n) return
    if (favourites.some((f) => normalizeName(f.name) === n)) {
      show({ text: `"${favName.trim()}" is already a favourite` })
      return
    }
    addFavourite({ name: favName, section: 'standard' })
    setFavName('')
  }

  const list = useMemo(() => groupByCategory(
    favourites.filter((f) => f.section === 'standard').map((f) => ({
      ...f, category: resolveAisle(normalizeName(f.name), categories),
    })),
  ).flatMap((group) => group.items), [favourites, categories])

  const renderList = () => {
    if (list.length === 0) return <EmptyState>No favourites yet. Add items you buy every week.</EmptyState>
    return (
      <ul className="divide-y divide-[var(--border)] card">
        {list.map((f, i) => {
          const norm = normalizeName(f.name)
          const key = `standard:${norm}`
          const alreadyAdded = extrasSet.has(key)
          return (
            <li key={key + ':' + i} className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate">{f.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 max-w-[60%]">
                <CategorySelect
                  value={resolveAisle(norm, categories)}
                  onChange={(c) => {
                    if (!c && autoAisle(norm)) setItemCategory(norm, NO_AISLE)
                    else setItemCategory(norm, c)
                  }}
                  itemName={f.name}
                />
                <label className="inline-flex items-center gap-2 mr-2">
                  <input
                    type="checkbox"
                    checked={alreadyAdded}
                    onChange={() => {
                      if (alreadyAdded) removeExtra(norm, 'standard')
                      else addExtra({ name: f.name, section: 'standard', source: 'favourite' })
                    }}
                    aria-label={`Include favourite ${f.name} this week`}
                  />
                </label>
                <button className="btn-icon btn-icon-danger" onClick={() => removeFavourite(norm, 'standard')} aria-label={`Remove favourite ${f.name}`} title="Remove favourite">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 7h12M9 7l1-2h4l1 2M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                  <span className="sr-only">Remove</span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={favName}
          onChange={(e) => setFavName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addFav()
            }
          }}
          className="flex-1 input"
          placeholder="e.g. Bananas"
          aria-label="Favourite item name"
          enterKeyHint="done"
        />
        <button className="btn-primary" onClick={addFav} disabled={!favName.trim()}>
          Add
        </button>
      </div>
      <div className="mt-3">
        {renderList()}
      </div>
    </div>
  )
}
