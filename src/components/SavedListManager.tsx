import { useState } from 'react'
import { useStore } from '../state/store'

export function SavedListManager() {
  const { savedLists, saveCurrentAs, loadSavedList, deleteSavedList, currentListId } = useStore()
  const [name, setName] = useState('')
  const autoList = savedLists.find((l) => l.auto)
  const manualLists = savedLists.filter((l) => !l.auto)

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

      {autoList && (
        <div className="card p-3 text-sm text-slate-600">
          <div className="font-medium text-slate-800">Progress auto-saved</div>
          <div className="mt-1">{autoList.name}</div>
          <div className="text-xs text-slate-500 mt-1">
            Last updated {new Date(autoList.updatedAt).toLocaleString()}. Your current list will resume automatically when you
            return.
          </div>
        </div>
      )}

      <div>
        <h3 className="font-medium mb-1">Saved lists</h3>
        {manualLists.length === 0 ? (
          <p className="text-sm text-slate-500">None yet.</p>
        ) : (
          <ul className="divide-y card">
            {manualLists.map((l) => (
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
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 7h12M9 7l1-2h4l1 2M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
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
