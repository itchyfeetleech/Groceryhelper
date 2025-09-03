import type { ExtraItem, Recipe } from '../types'
import { chooseDisplayName, normalizeName, titleCaseFromNormalized } from './normalization'

export type AggregatedItem = { norm: string; name: string; count: number }
export type Aggregated = {
  standard: AggregatedItem[]
  special: AggregatedItem[]
}

export function aggregate(
  recipes: Recipe[],
  recipeIds: string[],
  extras: ExtraItem[],
): Aggregated {
  const bySection: Record<'standard' | 'special', Map<string, { count: number; variants: string[] }>> = {
    standard: new Map(),
    special: new Map(),
  }

  const recipeById = new Map(recipes.map((r) => [r.id, r]))

  for (const rid of recipeIds) {
    const r = recipeById.get(rid)
    if (!r) continue
    for (const ing of r.standard) {
      const norm = normalizeName(ing)
      if (!norm) continue
      const entry = bySection.standard.get(norm) ?? { count: 0, variants: [] }
      entry.count += 1
      entry.variants.push(ing)
      bySection.standard.set(norm, entry)
    }
    for (const ing of r.special) {
      const norm = normalizeName(ing)
      if (!norm) continue
      const entry = bySection.special.get(norm) ?? { count: 0, variants: [] }
      entry.count += 1
      entry.variants.push(ing)
      bySection.special.set(norm, entry)
    }
  }

  for (const ex of extras) {
    const norm = normalizeName(ex.name)
    if (!norm) continue
    const map = bySection[ex.section]
    const entry = map.get(norm) ?? { count: 0, variants: [] }
    entry.count += 1
    entry.variants.push(ex.name)
    map.set(norm, entry)
  }

  const toList = (
    map: Map<string, { count: number; variants: string[] }>
  ): AggregatedItem[] =>
    [...map.entries()]
      .map(([norm, { count, variants }]) => ({
        norm,
        count,
        name: chooseDisplayName(norm, variants.length ? variants : [titleCaseFromNormalized(norm)]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

  return {
    standard: toList(bySection.standard),
    special: toList(bySection.special),
  }
}

