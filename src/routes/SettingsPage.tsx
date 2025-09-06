import { useRef, useState } from 'react'
import { useEffect, useState as useReactState } from 'react'
import { useSyncAuth, signOutSync, signInWithGoogle } from '../sync'
import { useStore } from '../state/store'

export function SettingsPage() {
  const { exportJSON, importJSON } = useStore()
  const [exportText, setExportText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [syncEnabled, setSyncEnabled] = useReactState(false)
  const [userId, setUserId] = useReactState<string | null>(null)
  const [userLabel, setUserLabel] = useReactState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useReactState<boolean>(false)

  useEffect(() => {
    const { enabled, user } = useSyncAuth()
    setSyncEnabled(enabled)
    setUserId(user?.uid ?? null)
    setIsAnonymous(!!user?.isAnonymous)
    const provider = user?.providerData?.[0]
    const label = provider?.displayName || provider?.email || (user?.uid ? user.uid.slice(0, 8) : null)
    setUserLabel(label ?? null)
    const i = setInterval(() => {
      const { enabled, user } = useSyncAuth()
      setSyncEnabled(enabled)
      setUserId(user?.uid ?? null)
      setIsAnonymous(!!user?.isAnonymous)
      const provider = user?.providerData?.[0]
      const label = provider?.displayName || provider?.email || (user?.uid ? user.uid.slice(0, 8) : null)
      setUserLabel(label ?? null)
    }, 1000)
    return () => clearInterval(i)
  }, [])

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

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    try {
      importJSON(text)
      alert('Import successful')
    } catch (e: any) {
      alert('Import failed: ' + e.message)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onImportText = () => {
    try {
      importJSON(exportText)
      alert('Import successful')
    } catch (e: any) {
      alert('Import failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <section className="space-y-2">
        <h2 className="font-medium">Sync</h2>
        {syncEnabled ? (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-slate-700">
              {userId ? (
                isAnonymous ? (
                  <>Signed in anonymously. You can sign in with Google.</>
                ) : (
                  <>Signed in as <span className="font-medium">{userLabel}</span> via Google</>
                )
              ) : 'Not signed in.'}
            </div>
            <div className="flex items-center gap-2">
              {(!userId || isAnonymous) && (
                <button
                  className="px-3 py-2 rounded border hover:bg-slate-50 active:bg-slate-100"
                  onClick={() => void signInWithGoogle()}
                >
                  Sign in with Google
                </button>
              )}
              {userId && (
                <button className="px-3 py-2 rounded border hover:bg-slate-50 active:bg-slate-100" onClick={signOutSync}>Sign out</button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Sync not configured. Set Vite env vars for Firebase and rebuild.</div>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-medium">Backup</h2>
        <div className="flex gap-2 items-center">
          <button className="px-3 py-2 rounded border hover:bg-slate-50 active:bg-slate-100" onClick={doExport}>Export JSON</button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImportFile} aria-label="Import JSON file" />
        </div>
        <textarea
          className="w-full h-40 border rounded p-2"
          value={exportText}
          onChange={(e) => setExportText(e.target.value)}
          placeholder="Backup JSON appears here after export. Paste here to import."
        />
        <div>
          <button className="px-3 py-2 rounded border hover:bg-slate-50 active:bg-slate-100" onClick={onImportText}>Import from text</button>
        </div>
      </section>
    </div>
  )
}
