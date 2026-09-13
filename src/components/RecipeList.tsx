import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/store'
import type { Recipe } from '../types'
import { RecipeEditor } from './RecipeEditor'
import { EmptyState } from '../ui/EmptyState'
import { PageHeading } from '../ui/PageHeading'

export function RecipeList() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, selectedRecipeIds, setSelectedRecipeIds } = useStore()
  const [q, setQ] = useState('')
  // Editor open state lives in the URL (?edit=<id>) so the Android/browser
  // back button closes the editor instead of leaving the app.
  const [searchParams, setSearchParams] = useSearchParams()
  const editingId = searchParams.get('edit')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase()
    if (!nq) return recipes
    return recipes.filter((r) => r.title.toLowerCase().includes(nq))
  }, [recipes, q])

  const openEditor = (id: string) => {
    // Switching between recipes replaces the entry so back always closes the editor
    setSearchParams({ edit: id }, { replace: editingId !== null })
  }

  const startNew = () => {
    setSearchParams({ edit: 'new' })
  }

  const newDraft = useMemo<Recipe>(() => ({
    id: 'new', title: '', standard: [], special: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }), [])
  const editing = editingId === 'new' ? newDraft : recipes.find((r) => r.id === editingId) || null

  const closeEditor = () => {
    // Prefer going back so the history entry created by opening is consumed;
    // fall back to clearing the param for direct deep links.
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else setSearchParams({}, { replace: true })
  }

  if (editing) {
    const heading = editingId === 'new' ? 'New recipe' : 'Edit recipe'
    return (
      <div className="space-y-4">
        <button className="inline-flex items-center gap-2 text-sm text-soft" onClick={closeEditor}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
          Back
        </button>
        <h1 className="page-title">{heading}</h1>
        <div className="card p-4">
          <RecipeEditor
            key={editing.id}
            value={editing}
            onSave={(recipe) => {
              if (editingId === 'new') addRecipe({ title: recipe.title, standard: recipe.standard, special: recipe.special })
              else updateRecipe(recipe)
              closeEditor()
            }}
            onDelete={editingId === 'new' ? undefined : () => {
              if (confirm(`Delete "${editing.title || 'this recipe'}"?`)) {
                deleteRecipe(editing.id)
                setSearchParams({}, { replace: true })
              }
            }}
            otherTitles={recipes.filter((r) => r.id !== editing.id).map((r) => r.title)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeading>Recipes</PageHeading>
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
          <EmptyState>
            {recipes.length === 0 ? 'No recipes yet. Create your first one!' : 'No recipes match your search.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)] card">
            {filtered.map((r) => (
              <li key={r.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.title || <span className="muted">(Untitled)</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center justify-end flex-wrap shrink-0 max-w-[60%]">
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
                  </label>
                  <button
                    className="btn-icon"
                    onClick={() => openEditor(r.id)}
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
