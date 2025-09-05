import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { normalizeName } from '../utils/normalization'

export function FavouritesPanel() {
  const { favourites, extras, addFavourite, removeFavourite, addExtra } = useStore()
  const [favName, setFavName] = useState('')
  const [favSection, setFavSection] = useState<'standard' | 'special'>('standard')

  const extrasSet = useMemo(() => {
    return new Set(
      extras.map((e) => `${e.section}:${normalizeName(e.name)}`)
    )
  }, [extras])

  const addFav = () => {
    const n = normalizeName(favName)
    if (!n) return
    addFavourite({ name: favName, section: favSection })
    setFavName('')
  }

  const grouped = useMemo(() => {
    return {
      standard: favourites.filter((f) => f.section === 'standard'),
      special: favourites.filter((f) => f.section === 'special'),
    }
  }, [favourites])

  const renderList = (list: { name: string; section: 'standard' | 'special' }[]) => {
    if (list.length === 0) return <p className="text-sm text-slate-500">None</p>
    return (
      <ul className="divide-y border rounded bg-white max-h-60 overflow-auto">
        {list.map((f, i) => {
          const norm = normalizeName(f.name)
          const key = `${f.section}:${norm}`
          const alreadyAdded = extrasSet.has(key)
          return (
            <li key={key + ':' + i} className="p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{f.name}</span>
                <span className="text-xs text-slate-500">{f.section}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 rounded border ${alreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => addExtra({ name: f.name, section: f.section })}
                  disabled={alreadyAdded}
                  aria-label={`Add favourite ${f.name}`}
                >
                  {alreadyAdded ? 'Added' : 'Add'}
                </button>
                <button
                  className="px-2 py-1 rounded border border-red-300 text-red-700"
                  onClick={() => removeFavourite(norm, f.section)}
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
          placeholder="Add favourite item"
          aria-label="Favourite item name"
        />
        <select
          value={favSection}
          onChange={(e) => setFavSection(e.target.value as any)}
          className="border rounded px-2"
          aria-label="Favourite item section"
        >
          <option value="standard">Standard</option>
          <option value="special">Special</option>
        </select>
        <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={addFav}>Add Favourite</button>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h3 className="font-medium mb-1">Standard</h3>
          {renderList(grouped.standard)}
        </div>
        <div>
          <h3 className="font-medium mb-1">Special</h3>
          {renderList(grouped.special)}
        </div>
      </div>
    </div>
  )
}

