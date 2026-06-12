import { useState } from 'react'
import { useStore } from '../state/store'
import { useToast } from '../ui/Toast'
import { EmptyState } from '../ui/EmptyState'

export function SavedListManager() {
  const { savedLists, saveCurrentAs, loadSavedList, deleteSavedList, currentListId } = useStore()
  const { show } = useToast()
  const [name, setName] = useState('')
  const autoList = savedLists.find((l) => l.auto)
  const manualLists = savedLists.filter((l) => !l.auto)
  const loadedList = manualLists.find((l) => l.id === currentListId)

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    saveCurrentAs(trimmed)
    setName('')
    show({ text: loadedList ? `Updated "${trimmed}"` : `Saved "${trimmed}"` })
  }

  return (
    <div className="space-y-3">
      <h2 className="font-medium">Saved lists</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              save()
            }
          }}
          placeholder="List name"
          className="flex-1 input"
          aria-label="Saved list name"
          enterKeyHint="done"
        />
        <button className="btn-primary" onClick={save} disabled={!name.trim()}>
          {loadedList ? 'Update' : 'Save'}
        </button>
      </div>
      {loadedList && (
        <p className="text-xs muted">
          Saving updates &ldquo;{loadedList.name}&rdquo; with the current selection.
        </p>
      )}

      {autoList && (
        <div className="card p-3 text-sm muted">
          <div className="font-semibold">Progress auto-saved</div>
          <div className="text-xs muted mt-1">
            Last updated {new Date(autoList.updatedAt).toLocaleString()}. Your current list will resume automatically
            when you return.
          </div>
        </div>
      )}

      <div>
        {manualLists.length === 0 ? (
          <EmptyState>No saved lists yet. Save the current list to reuse it later.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)] card">
            {manualLists.map((l) => {
              const isLoaded = l.id === currentListId
              return (
                <li key={l.id} className="p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {l.name}
                      {isLoaded && (
                        <span className="badge badge-special ml-2 align-middle">
                          Loaded
                        </span>
                      )}
                    </div>
                    <div className="text-xs muted">{new Date(l.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="btn btn-xs"
                      onClick={() => {
                        loadSavedList(l.id)
                        show({ text: `Loaded "${l.name}"` })
                      }}
                      disabled={isLoaded}
                      aria-current={isLoaded ? 'true' : undefined}
                    >
                      Load
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => {
                        if (confirm(`Delete saved list "${l.name}"?`)) deleteSavedList(l.id)
                      }}
                      title="Delete saved list"
                      aria-label={`Delete ${l.name}`}
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
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
