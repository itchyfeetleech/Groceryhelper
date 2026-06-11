/** Store aisles in walking order. */
export const CATEGORIES = [
  'Produce',
  'Bakery',
  'Meat & Fish',
  'Dairy & Eggs',
  'Frozen',
  'Pantry',
  'Snacks',
  'Drinks',
  'Household',
  'Personal care',
] as const

export type Category = (typeof CATEGORIES)[number]

export function isKnownCategory(value: string | undefined): value is Category {
  return !!value && (CATEGORIES as readonly string[]).includes(value)
}

export type CategoryGroup<T> = { category: Category | null; items: T[] }

/**
 * Group items by aisle: known categories in CATEGORIES (walking) order,
 * uncategorized (or unknown-category) items in a trailing null group.
 * Empty groups are omitted.
 */
export function groupByCategory<T extends { category?: string }>(items: T[]): CategoryGroup<T>[] {
  const byCategory = new Map<Category, T[]>()
  const uncategorized: T[] = []
  for (const item of items) {
    if (isKnownCategory(item.category)) {
      const arr = byCategory.get(item.category)
      if (arr) arr.push(item)
      else byCategory.set(item.category, [item])
    } else {
      uncategorized.push(item)
    }
  }
  const groups: CategoryGroup<T>[] = []
  for (const category of CATEGORIES) {
    const arr = byCategory.get(category)
    if (arr) groups.push({ category, items: arr })
  }
  if (uncategorized.length) groups.push({ category: null, items: uncategorized })
  return groups
}
