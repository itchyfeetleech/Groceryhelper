import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { normalizeName } from '../utils/normalization'

export function FavouritesPanel() {
  const { favourites, extras, addFavourite, removeFavourite, addExtra, removeExtra } = useStore()
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

  const list = useMemo(() => favourites.filter((f) => f.section === 'standard'), [favourites])

  const renderList = () => {
    if (list.length === 0) return <p className="text-sm text-slate-500">None</p>
    return (
      <ul className="divide-y card max-h-60 overflow-auto">
        {list.map((f, i) => {
          const norm = normalizeName(f.name)
          const key = `standard:${norm}`
          const alreadyAdded = extrasSet.has(key)
          return (
            <li key={key + ':' + i} className="p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{f.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alreadyAdded}
                    onChange={() => {
                      if (alreadyAdded) removeExtra(norm, 'standard')
                      else addExtra({ name: f.name, section: 'standard', source: 'favourite' })
                    }}
                    aria-label={`Include favourite ${f.name} this week`}
                  />
                  <span className="text-xs">This week</span>
                </label>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => removeFavourite(norm, 'standard')}
                  aria-label={`Remove favourite ${f.name}`}
                  title="Remove favourite"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M6 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h4v2H0V2h6Zm2 18a2 2 0 0 1-2-2V6h12v12a2 2 0 0 1-2 2H8Zm2-10h2v8h-2v-8Zm6 0h-2v8h2v-8ZM8 10H6v8h2v-8Z"/></svg>
                  <span className="sr-only">Remove</span>
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
          className="flex-1 input"
          placeholder="Add favourite item (always standard)"
          aria-label="Favourite item name"
        />
        <button className="btn-primary" onClick={addFav} disabled={!favName.trim()}>
          Add Favourite
        </button>
      </div>
      <div className="mt-3">
        <h3 className="font-medium mb-1">Saved favourites</h3>
        {renderList()}
      </div>
    </div>
  )
}
