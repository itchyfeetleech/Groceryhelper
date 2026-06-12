import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/store'
import type { Recipe } from '../types'
import { RecipeEditor } from './RecipeEditor'
import { EmptyState } from '../ui/EmptyState'

function isEmptyDraft(r: Recipe | undefined): boolean {
  return !!r && !r.title.trim() && r.standard.length === 0 && r.special.length === 0
}

export function RecipeList() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, selectedRecipeIds, setSelectedRecipeIds } = useStore()
  const [q, setQ] = useState('')
  // Editor open state lives in the URL (?edit=<id>) so the Android/browser
  // back button closes the editor instead of leaving the app.
  const [searchParams, setSearchParams] = useSearchParams()
  const editingId = searchParams.get('edit')
  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement>(null)

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
    const id = addRecipe({ title: '', standard: [], special: [] })
    openEditor(id)
  }

  const editing = recipes.find((r) => r.id === editingId) || null

  // Discard drafts that were never filled in, whenever the editor closes or
  // switches away from them (Done button, back button, or edit of another recipe).
  const prevEditingIdRef = useRef<string | null>(editingId)
  useEffect(() => {
    const prevId = prevEditingIdRef.current
    prevEditingIdRef.current = editingId
    if (prevId && prevId !== editingId) {
      const prev = useStore.getState().recipes.find((r) => r.id === prevId)
      if (isEmptyDraft(prev)) deleteRecipe(prevId)
    }
  }, [editingId, deleteRecipe])
  // Also clean up when leaving the page entirely (e.g. bottom-nav to another tab)
  useEffect(() => {
    return () => {
      const id = prevEditingIdRef.current
      if (!id) return
      const r = useStore.getState().recipes.find((x) => x.id === id)
      if (isEmptyDraft(r)) useStore.getState().deleteRecipe(id)
    }
  }, [])

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
    // Prefer going back so the history entry created by opening is consumed;
    // fall back to clearing the param for direct deep links.
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else setSearchParams({}, { replace: true })
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
                  <div className="text-xs muted">
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
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => {
                      if (confirm(`Delete "${r.title || 'this recipe'}"?`)) {
                        if (editingId === r.id) setSearchParams({}, { replace: true })
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
          <div className="text-sm muted">Select a recipe to edit, or create a new one.</div>
        )}
      </section>
    </div>
  )
}
