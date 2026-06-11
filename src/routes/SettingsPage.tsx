import { useRef, useState } from 'react'
import { syncEnabled, useSyncUser, signOutSync, signInWithGoogle } from '../sync'
import { useStore } from '../state/store'
import { useToast } from '../ui/Toast'

export function SettingsPage() {
  const { exportJSON, importJSON } = useStore()
  const { show } = useToast()
  const [exportText, setExportText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const user = useSyncUser()
  const isAnonymous = !!user?.isAnonymous
  const provider = user?.providerData?.[0]
  const userLabel = provider?.displayName || provider?.email || (user?.uid ? user.uid.slice(0, 8) : null)

  const doExport = () => {
    const txt = exportJSON()
    setExportText(txt)
    const blob = new Blob([txt], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recipes-groceries-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (text: string) => {
    if (!confirm('Importing replaces all current recipes, lists, and favourites. Continue?')) return false
    try {
      importJSON(text)
      show({ text: 'Import successful' })
      return true
    } catch (e) {
      alert('Import failed: ' + (e instanceof Error ? e.message : String(e)))
      return false
    }
  }

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    doImport(text)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <div className="text-sm muted">Version: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}</div>
      <section className="space-y-2">
        <h2 className="font-medium">Sync</h2>
        {syncEnabled ? (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-slate-700">
              {user ? (
                isAnonymous ? (
                  <>Signed in anonymously. Sign in with Google to keep your data across devices.</>
                ) : (
                  <>
                    Signed in as <span className="font-medium">{userLabel}</span> via Google
                  </>
                )
              ) : (
                'Not signed in.'
              )}
            </div>
            <div className="flex items-center gap-2">
              {(!user || isAnonymous) && (
                <button className="btn" onClick={() => void signInWithGoogle()}>
                  Sign in with Google
                </button>
              )}
              {user && (
                <button className="btn" onClick={() => void signOutSync()}>
                  Sign out
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Sync not configured. Set Vite env vars for Firebase and rebuild.</div>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-medium">Backup</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <button className="btn" onClick={doExport}>
            Export JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImportFile} aria-label="Import JSON file" />
        </div>
        <textarea
          className="w-full h-40 border rounded p-2"
          value={exportText}
          onChange={(e) => setExportText(e.target.value)}
          aria-label="Backup JSON"
          placeholder="Backup JSON appears here after export. Paste here to import."
        />
        <div>
          <button className="btn" onClick={() => doImport(exportText)} disabled={!exportText.trim()}>
            Import from text
          </button>
        </div>
      </section>
    </div>
  )
}
