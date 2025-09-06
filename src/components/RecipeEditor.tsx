import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeName } from '../utils/normalization'
import type { Recipe } from '../types'
import { IngredientChips } from './IngredientChips'

type Props = {
  value: Recipe
  onChange: (r: Recipe) => void
  onSave: () => void
}

export function RecipeEditor({ value, onChange, onSave }: Props) {
  const [title, setTitle] = useState(value.title)
  const [standard, setStandard] = useState<string[]>(value.standard)
  const [special, setSpecial] = useState<string[]>(value.special)
  const [warnDupTitle, setWarnDupTitle] = useState(false)
  const stdInput = useRef<HTMLInputElement>(null)
  const spcInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(value.title)
    setStandard(value.standard)
    setSpecial(value.special)
  }, [value])

  useEffect(() => {
    onChange({ ...value, title, standard, special })
  }, [title, standard, special])

  const handleAddStandard = () => {
    const val = stdInput.current?.value ?? ''
    const name = val.trim()
    const norm = normalizeName(name)
    if (!norm) return
    if (standard.some((i) => normalizeName(i) === norm) || special.some((i) => normalizeName(i) === norm)) return
    setStandard([...standard, name])
    if (stdInput.current) stdInput.current.value = ''
  }
  const handleAddSpecial = () => {
    const val = spcInput.current?.value ?? ''
    const name = val.trim()
    const norm = normalizeName(name)
    if (!norm) return
    if (special.some((i) => normalizeName(i) === norm) || standard.some((i) => normalizeName(i) === norm)) return
    setSpecial([...special, name])
    if (spcInput.current) spcInput.current.value = ''
  }

  const removeAt = (section: 'standard' | 'special', index: number) => {
    if (section === 'standard') setStandard(standard.filter((_, i) => i !== index))
    else setSpecial(special.filter((_, i) => i !== index))
  }
  const moveUp = (section: 'standard' | 'special', index: number) => {
    const arr = section === 'standard' ? [...standard] : [...special]
    if (index <= 0) return
    const [item] = arr.splice(index, 1)
    arr.splice(index - 1, 0, item)
    section === 'standard' ? setStandard(arr) : setSpecial(arr)
  }
  const moveDown = (section: 'standard' | 'special', index: number) => {
    const arr = section === 'standard' ? [...standard] : [...special]
    if (index >= arr.length - 1) return
    const [item] = arr.splice(index, 1)
    arr.splice(index + 1, 0, item)
    section === 'standard' ? setStandard(arr) : setSpecial(arr)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  const dupWithin = useMemo(() => {
    const set = new Set<string>()
    const dups: string[] = []
    for (const n of [...standard, ...special].map(normalizeName)) {
      if (set.has(n)) dups.push(n)
      set.add(n)
    }
    return dups
  }, [standard, special])

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">Title</label>
        <input
          id="title"
          className="mt-1 w-full border rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        {warnDupTitle && (
          <p className="text-xs text-amber-700 mt-1">Warning: another recipe has this title.</p>
        )}
      </div>

      <fieldset>
        <legend className="font-medium">Standard ingredients</legend>
        <div className="flex gap-2 mt-1">
          <input
            ref={stdInput}
            placeholder="Add ingredient and press Enter"
            className="flex-1 border rounded px-3 py-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddStandard() }
            }}
            aria-label="Add standard ingredient"
          />
        </div>
        <div className="mt-2">
          <IngredientChips
            items={standard}
            onDelete={(i) => removeAt('standard', i)}
            onMoveUp={(i) => moveUp('standard', i)}
            onMoveDown={(i) => moveDown('standard', i)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium">Special ingredients</legend>
        <div className="flex gap-2 mt-1">
          <input
            ref={spcInput}
            placeholder="Add ingredient and press Enter"
            className="flex-1 border rounded px-3 py-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddSpecial() }
            }}
            aria-label="Add special ingredient"
          />
        </div>
        <div className="mt-2">
          <IngredientChips
            items={special}
            onDelete={(i) => removeAt('special', i)}
            onMoveUp={(i) => moveUp('special', i)}
            onMoveDown={(i) => moveDown('special', i)}
          />
        </div>
      </fieldset>

      {dupWithin.length > 0 && (
        <p className="text-xs text-amber-700">Duplicate names across sections will aggregate by name.</p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50">Save</button>
      </div>
    </form>
  )
}

function Chips({
  items,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  items: string[]
  onDelete: (i: number) => void
  onMoveUp: (i: number) => void
  onMoveDown: (i: number) => void
}) {
  if (!items.length) return <p className="text-sm text-slate-500">No ingredients.</p>
  return (
    <ul className="flex flex-wrap gap-2" aria-live="polite">
      {items.map((ing, i) => (
        <li key={`${normalizeName(ing)}-${i}`} className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
          <span className="text-sm">{ing}</span>
          <button type="button" className="text-xs px-1 rounded border border-slate-300" onClick={() => onMoveUp(i)} disabled={i === 0} aria-label={`Move ${ing} up`}>↑</button>
          <button type="button" className="text-xs px-1 rounded border border-slate-300" onClick={() => onMoveDown(i)} disabled={i === items.length - 1} aria-label={`Move ${ing} down`}>↓</button>
          <button type="button" className="text-xs px-1 rounded border border-red-300 text-red-700" onClick={() => onDelete(i)} aria-label={`Remove ${ing}`}>✕</button>
        </li>
      ))}
    </ul>
  )
}
