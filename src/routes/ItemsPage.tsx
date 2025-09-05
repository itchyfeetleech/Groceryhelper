import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { normalizeName } from '../utils/normalization'
import { FavouritesPanel } from '../components/FavouritesPanel'

export function ItemsPage() {
  const { extras, addExtra, removeExtra } = useStore()
  const [extraName, setExtraName] = useState('')

  const addExtraItem = () => {
    const n = normalizeName(extraName)
    if (!n) return
    // Always "special"
    addExtra({ name: extraName, section: 'special' })
    setExtraName('')
  }

  const extrasNorms = useMemo(
    () => new Set(extras.map((e) => `${e.section}:${normalizeName(e.name)}`)),
    [extras]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Items</h1>
      <section>
        <h2 className="font-medium mb-2">Individual items</h2>
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
            placeholder="Add item (always special)"
            aria-label="Add individual item"
          />
          <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={addExtraItem}>Add</button>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          <p>Items here are added as special and combine with recipes.</p>
        </div>
        <div className="mt-3">
          <h3 className="font-medium">Current items</h3>
          {extras.length === 0 ? (
            <p className="text-sm text-slate-500">None</p>
          ) : (
            <ul className="divide-y border rounded bg-white max-h-60 overflow-auto">
              {extras.map((e, i) => {
                const norm = normalizeName(e.name)
                const key = `${e.section}:${norm}`
                return (
                  <li key={key + ':' + i} className="p-2 flex items-center justify-between">
                    <span>{e.name}</span>
                    <button
                      className="px-2 py-1 rounded border border-red-300 text-red-700"
                      onClick={() => removeExtra(norm, 'special')}
                      aria-label={`Remove item ${e.name}`}
                    >Remove</button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <FavouritesPanel />
    </div>
  )
}

