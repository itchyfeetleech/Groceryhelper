import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { normalizeName } from '../utils/normalization'

export function FavouritesPanel() {
  const { favourites, extras, addFavourite, removeFavourite, addExtra } = useStore()
  const [favName, setFavName] = useState('')

  const extrasSet = useMemo(() => {
    return new Set(
      extras.map((e) => `${e.section}:${normalizeName(e.name)}`)
    )
  }, [extras])

  const addFav = () => {
    const n = normalizeName(favName)
    if (!n) return
    addFavourite({ name: favName, section: 'special' })
    setFavName('')
  }

  const list = useMemo(() => favourites.filter((f) => f.section === 'special'), [favourites])

  const renderList = () => {
    if (list.length === 0) return <p className="text-sm text-slate-500">None</p>
    return (
      <ul className="divide-y border rounded bg-white max-h-60 overflow-auto">
        {list.map((f, i) => {
          const norm = normalizeName(f.name)
          const key = `special:${norm}`
          const alreadyAdded = extrasSet.has(key)
          return (
            <li key={key + ':' + i} className="p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{f.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 rounded border ${alreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => addExtra({ name: f.name, section: 'special' })}
                  disabled={alreadyAdded}
                  aria-label={`Add favourite ${f.name}`}
                >
                  {alreadyAdded ? 'Added' : 'Add'}
                </button>
                <button
                  className="px-2 py-1 rounded border border-red-300 text-red-700"
                  onClick={() => removeFavourite(norm, 'special')}
                  aria-label={`Remove favourite ${f.name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="mt-6">
      <h2 className="font-medium mb-2">Favourites</h2>
      <div className="flex gap-2">
        <input
          value={favName}
          onChange={(e) => setFavName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addFav()
            }
          }}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Add favourite item (always special)"
          aria-label="Favourite item name"
        />
        <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={addFav}>Add Favourite</button>
      </div>
      <div className="mt-3">
        <h3 className="font-medium mb-1">Saved favourites</h3>
        {renderList()}
      </div>
    </div>
  )
}
