import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { RecipeEditor } from './RecipeEditor'

export function RecipeList() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, selectedRecipeIds, setSelectedRecipeIds } = useStore()
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

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

  // On small screens the editor renders below the list; bring it into view
  useEffect(() => {
    if (editingId && window.innerWidth < 768) {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editingId])

  const duplicateTitle = useMemo(() => {
    if (!editing) return false
    const norm = editing.title.trim().toLowerCase()
    if (!norm) return false
    return recipes.some((r) => r.id !== editing.id && r.title.trim().toLowerCase() === norm)
  }, [recipes, editing])

  const closeEditor = () => {
    // Discard drafts that were never filled in
    if (editing && !editing.title.trim() && editing.standard.length === 0 && editing.special.length === 0) {
      deleteRecipe(editing.id)
    }
    setEditingId(null)
  }

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
          <p className="text-sm text-slate-500">
            {recipes.length === 0 ? 'No recipes yet. Create your first one!' : 'No recipes match your search.'}
          </p>
        ) : (
          <ul className="divide-y card">
            {filtered.map((r) => (
              <li key={r.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.title || <span className="text-slate-500">(Untitled)</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.standard.length} standard • {r.special.length} special
                  </div>
                </div>
                <div className="flex gap-2 items-center shrink-0">
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
                      aria-label={`Select recipe ${r.title || 'untitled'} for this week`}
                    />
                    <span className="text-xs">This week</span>
                  </label>
                  <button
                    className="btn-icon"
                    onClick={() => setEditingId(r.id)}
                    title="Edit recipe"
                    aria-label={`Edit ${r.title || 'recipe'}`}
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
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" />
                      <path d="M14.06 6.19l1.77-1.77a2.5 2.5 0 1 1 3.54 3.54L17.6 9.73" />
                    </svg>
                    <span className="sr-only">Edit</span>
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => {
                      if (confirm(`Delete "${r.title || 'this recipe'}"?`)) {
                        if (editingId === r.id) setEditingId(null)
                        deleteRecipe(r.id)
                      }
                    }}
                    title="Delete recipe"
                    aria-label={`Delete ${r.title || 'recipe'}`}
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
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section ref={editorRef} aria-live="polite">
        {editing ? (
          <div className="card p-4">
            <h2 className="font-medium mb-3">{editing.title ? 'Edit recipe' : 'New recipe'}</h2>
            <RecipeEditor
              value={editing}
              onChange={(r) => updateRecipe(r)}
              onSave={closeEditor}
              duplicateTitle={duplicateTitle}
            />
          </div>
        ) : (
          <div className="text-sm text-slate-500">Select a recipe to edit, or create a new one.</div>
        )}
      </section>
    </div>
  )
}
