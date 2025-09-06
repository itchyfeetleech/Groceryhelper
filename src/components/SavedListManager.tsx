import { useState } from 'react'
import { useStore } from '../state/store'

export function SavedListManager() {
  const { savedLists, saveCurrentAs, loadSavedList, deleteSavedList, currentListId } = useStore()
  const [name, setName] = useState('')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          className="flex-1 input"
          aria-label="Saved list name"
        />
        <button
          className="btn-primary"
          onClick={() => {
            if (!name.trim()) return
            const id = saveCurrentAs(name.trim())
            setName('')
          }}
        >
          Save
        </button>
      </div>

      <div>
        <h3 className="font-medium mb-1">Saved lists</h3>
        {savedLists.length === 0 ? (
          <p className="text-sm text-slate-500">None yet.</p>
        ) : (
          <ul className="divide-y card">
            {savedLists.map((l) => (
              <li key={l.id} className="p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-slate-500">{new Date(l.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-xs" onClick={() => loadSavedList(l.id)} aria-current={currentListId === l.id ? 'true' : undefined}>
                    Load
                  </button>
                  <button className="btn-icon btn-icon-danger" onClick={() => {
                    if (confirm('Delete this saved list?')) deleteSavedList(l.id)
                  }} title="Delete saved list" aria-label={`Delete ${l.name}`}>
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M6 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h4v2H0V2h6Zm2 18a2 2 0 0 1-2-2V6h12v12a2 2 0 0 1-2 2H8Zm2-10h2v8h-2v-8Zm6 0h-2v8h2v-8ZM8 10H6v8h2v-8Z"/></svg>
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
