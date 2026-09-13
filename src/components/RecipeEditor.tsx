import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeName } from '../utils/normalization'
import type { Recipe } from '../types'
import { IngredientChips } from './IngredientChips'

type Props = {
  value: Recipe
  onSave: (r: Recipe) => void
  onDelete?: () => void
  otherTitles: string[]
}

export function RecipeEditor({ value, onSave, onDelete, otherTitles }: Props) {
  const [title, setTitle] = useState(value.title)
  const [standard, setStandard] = useState<string[]>(value.standard)
  const [special, setSpecial] = useState<string[]>(value.special)
  const [dupNotice, setDupNotice] = useState('')
  const titleInput = useRef<HTMLInputElement>(null)
  const stdInput = useRef<HTMLInputElement>(null)
  const spcInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(value.title)
    setStandard(value.standard)
    setSpecial(value.special)
  }, [value])

  // Focus the title when starting a brand-new recipe
  useEffect(() => {
    if (!value.title) titleInput.current?.focus()
  }, [value.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const duplicateTitle = otherTitles.some((other) => other.trim().toLowerCase() === title.trim().toLowerCase())

  const addIngredient = (section: 'standard' | 'special') => {
    const input = section === 'standard' ? stdInput.current : spcInput.current
    const name = (input?.value ?? '').trim()
    const norm = normalizeName(name)
    if (!norm) return
    if (standard.some((i) => normalizeName(i) === norm) || special.some((i) => normalizeName(i) === norm)) {
      setDupNotice(`"${name}" is already in this recipe.`)
      return
    }
    setDupNotice('')
    if (section === 'standard') setStandard([...standard, name])
    else setSpecial([...special, name])
    if (input) input.value = ''
  }

  const removeAt = (section: 'standard' | 'special', index: number) => {
    if (section === 'standard') setStandard(standard.filter((_, i) => i !== index))
    else setSpecial(special.filter((_, i) => i !== index))
  }
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ ...value, title: title.trim(), standard, special })
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
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          ref={titleInput}
          className="mt-1 input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Lasagne"
          required
        />
        {duplicateTitle && <p className="text-xs text-amber-700 mt-1">Another recipe already has this title.</p>}
      </div>

      <fieldset>
        <legend className="font-medium">Staple ingredients</legend>
        <div className="flex gap-2 mt-1">
          <input
            ref={stdInput}
            placeholder="Add ingredient"
            className="flex-1 input"
            enterKeyHint="done"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addIngredient('standard')
              }
            }}
            aria-label="Add staple ingredient"
          />
          <button type="button" className="btn-primary" onClick={() => addIngredient('standard')}>
            Add
          </button>
        </div>
        <div className="mt-2">
          <IngredientChips
            items={standard}
            onDelete={(i) => removeAt('standard', i)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium">Special ingredients</legend>
        <div className="flex gap-2 mt-1">
          <input
            ref={spcInput}
            placeholder="Add ingredient"
            className="flex-1 input"
            enterKeyHint="done"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addIngredient('special')
              }
            }}
            aria-label="Add special ingredient"
          />
          <button type="button" className="btn-primary" onClick={() => addIngredient('special')}>
            Add
          </button>
        </div>
        <div className="mt-2">
          <IngredientChips
            items={special}
            onDelete={(i) => removeAt('special', i)}
          />
        </div>
      </fieldset>

      <div aria-live="polite">
        {dupNotice && <p className="text-xs text-amber-700">{dupNotice}</p>}
        {dupWithin.length > 0 && (
          <p className="text-xs text-amber-700">Duplicate names across sections will aggregate by name.</p>
        )}
      </div>

      <div className="flex gap-2 items-center justify-between flex-wrap">
        {onDelete && <button type="button" className="btn btn-icon-danger" onClick={onDelete}>Delete recipe</button>}
        <button type="submit" className="btn-primary ml-auto">
          Save
        </button>
      </div>
    </form>
  )
}
