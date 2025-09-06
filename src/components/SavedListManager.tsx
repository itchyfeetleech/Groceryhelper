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
          className="flex-1 border rounded px-3 py-2"
          aria-label="Saved list name"
        />
        <button
          className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50"
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
          <ul className="divide-y border rounded bg-white">
            {savedLists.map((l) => (
              <li key={l.id} className="p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-slate-500">{new Date(l.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded border hover:bg-slate-50 active:bg-slate-100" onClick={() => loadSavedList(l.id)} aria-current={currentListId === l.id ? 'true' : undefined}>
                    Load
                  </button>
                  <button className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 active:bg-red-100" onClick={() => {
                    if (confirm('Delete this saved list?')) deleteSavedList(l.id)
                  }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
