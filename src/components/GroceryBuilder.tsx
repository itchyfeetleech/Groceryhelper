import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { normalizeName } from '../utils/normalization'
import { FavouritesPanel } from './FavouritesPanel'

export function GroceryBuilder() {
  const { recipes, selectedRecipeIds, setSelectedRecipeIds, extras, addExtra, removeExtra } = useStore()
  const [extraName, setExtraName] = useState('')
  const [extraSection, setExtraSection] = useState<'standard' | 'special'>('standard')

  const toggleSelect = (id: string) => {
    if (selectedRecipeIds.includes(id)) {
      setSelectedRecipeIds(selectedRecipeIds.filter((x) => x !== id))
    } else {
      setSelectedRecipeIds([...selectedRecipeIds, id])
    }
  }

  const addExtraItem = () => {
    const n = normalizeName(extraName)
    if (!n) return
    addExtra({ name: extraName, section: extraSection })
    setExtraName('')
  }

  const removeExtraByNorm = (norm: string, section: 'standard' | 'special') => {
    removeExtra(norm, section)
  }

  const extrasBySection = useMemo(() => {
    const s = new Set(extras.filter((e) => e.section === 'standard').map((e) => normalizeName(e.name)))
    const p = new Set(extras.filter((e) => e.section === 'special').map((e) => normalizeName(e.name)))
    return { s, p }
  }, [extras])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <h2 className="font-medium mb-2">Select recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-sm text-slate-500">No recipes yet. Create some in the Recipes tab.</p>
        ) : (
          <ul className="divide-y border rounded bg-white max-h-96 overflow-auto">
            {recipes.map((r) => (
              <li key={r.id} className="p-2 flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRecipeIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    aria-label={`Select recipe ${r.title}`}
                  />
                  <span>{r.title || '(Untitled)'}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-medium mb-2">Extras</h2>
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
            placeholder="Add extra item"
            aria-label="Extra item name"
          />
          <select
            value={extraSection}
            onChange={(e) => setExtraSection(e.target.value as any)}
            className="border rounded px-2"
            aria-label="Extra item section"
          >
            <option value="standard">Standard</option>
            <option value="special">Special</option>
          </select>
          <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={addExtraItem}>Add</button>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          <p>Extras aggregate with recipe items. No duplicates per section.</p>
        </div>
        <div className="mt-3">
          <h3 className="font-medium">Current extras</h3>
          {extras.length === 0 ? (
            <p className="text-sm text-slate-500">None</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {extras.map((e, i) => (
                <span key={i} className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-2 py-1 text-sm">
                  <span>{e.name}</span>
                  <span className="text-xs text-slate-500">{e.section}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <FavouritesPanel />
      </section>
    </div>
  )
}
