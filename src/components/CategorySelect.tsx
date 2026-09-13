import { CATEGORIES, isKnownCategory } from '../utils/categories'

type Props = {
  /** Current aisle for the item, if any */
  value?: string
  onChange: (category: string | null) => void
  itemName: string
}

/** Chip-styled native select for assigning an item to a store aisle. */
export function CategorySelect({ value, onChange, itemName }: Props) {
  const selected = isKnownCategory(value) ? value : ''
  return (
    <span className="category-select-wrap">
      <span className="category-select-size" aria-hidden="true">{selected || 'No aisle'}</span>
    <select
      className={selected ? 'category-select category-select-set' : 'category-select'}
      value={selected}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label={`Aisle for ${itemName}`}
      title="Set aisle"
    >
      <option value="">No aisle</option>
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
    </span>
  )
}
