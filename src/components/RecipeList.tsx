import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { uid } from '../utils/id'
import type { Recipe } from '../types'
import { normalizeName } from '../utils/normalization'
import { RecipeEditor } from './RecipeEditor'

export function RecipeList() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, selectedRecipeIds, setSelectedRecipeIds } = useStore()
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase()
    if (!nq) return recipes
    return recipes.filter((r) => r.title.toLowerCase().includes(nq))
  }, [recipes, q])

  const startNew = () => {
    const id = addRecipe({ title: '', standard: [], special: [] })
    setEditingId(id)
  }

  const editing = recipes.find((r) => r.id === editingId) || null

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="search"
            placeholder="Search by title"
            className="flex-1 input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search recipes"
          />
          <button className="btn-primary" onClick={startNew}>
            New Recipe
          </button>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No recipes yet. Create your first one!</p>
        ) : (
          <ul className="divide-y card">
            {filtered.map((r) => (
              <li key={r.id} className="p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{r.title || <span className="text-slate-500">(Untitled)</span>}</div>
                  <div className="text-xs text-slate-500">
                    {r.standard.length} standard • {r.special.length} special
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="inline-flex items-center gap-2 mr-2">
                    <input
                      type="checkbox"
                      checked={selectedRecipeIds.includes(r.id)}
                      onChange={() => {
                        if (selectedRecipeIds.includes(r.id)) {
                          setSelectedRecipeIds(selectedRecipeIds.filter((x) => x !== r.id))
                        } else {
                          setSelectedRecipeIds([...selectedRecipeIds, r.id])
                        }
                      }}
                      aria-label={`Select recipe ${r.title} for this week`}
                    />
                    <span className="text-xs">This week</span>
                  </label>
                  <button className="btn-icon" onClick={() => setEditingId(r.id)} title="Edit recipe" aria-label={`Edit ${r.title || 'recipe'}`}>
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M2 14.5V18h3.5l9.9-9.9-3.5-3.5L2 14.5Zm12.8-10.3 3.5 3.5 1.1-1.1a1.5 1.5 0 0 0 0-2.1L16.5.7a1.5 1.5 0 0 0-2.1 0l-1.1 1.1 1.5 1.5Z"/></svg>
                    <span className="sr-only">Edit</span>
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => {
                      if (confirm('Delete this recipe?')) deleteRecipe(r.id)
                    }}
                    title="Delete recipe"
                    aria-label={`Delete ${r.title || 'recipe'}`}
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M6 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h4v2H0V2h6Zm2 18a2 2 0 0 1-2-2V6h12v12a2 2 0 0 1-2 2H8Zm2-10h2v8h-2v-8Zm6 0h-2v8h2v-8ZM8 10H6v8h2v-8Z"/></svg>
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-live="polite">
        {editing ? (
          <RecipeEditor
            value={editing}
            onChange={(r) => updateRecipe(r)}
            onSave={() => {
              const norm = editing.title.trim().toLowerCase()
              const dup = recipes.some((r) => r.id !== editing.id && r.title.trim().toLowerCase() === norm && norm !== '')
              if (dup) alert('Warning: another recipe has this title.')
              setEditingId(null)
            }}
          />
        ) : (
          <div className="text-sm text-slate-500">Select a recipe to edit, or create a new one.</div>
        )}
      </section>
    </div>
  )
}
