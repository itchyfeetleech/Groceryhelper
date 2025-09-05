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

export type AggregatedUnifiedItem = {
  norm: string
  name: string
  count: number
  sources: {
    standard: boolean
    special: boolean
    fromFavourite: boolean
    recipeNames: string[]
  }
}

export function aggregateUnified(
  recipes: Recipe[],
  recipeIds: string[],
  extras: ExtraItem[],
): AggregatedUnifiedItem[] {
  type Entry = {
    count: number
    variants: string[]
    standard: boolean
    special: boolean
    recipeNames: Set<string>
    fromFavourite: boolean
  }
  const map = new Map<string, Entry>()
  const recipeById = new Map(recipes.map((r) => [r.id, r]))

  const ensure = (norm: string): Entry => {
    const e = map.get(norm)
    if (e) return e
    const ne: Entry = { count: 0, variants: [], standard: false, special: false, recipeNames: new Set(), fromFavourite: false }
    map.set(norm, ne)
    return ne
  }

  for (const rid of recipeIds) {
    const r = recipeById.get(rid)
    if (!r) continue
    const title = r.title || '(Untitled)'
    for (const ing of r.standard) {
      const norm = normalizeName(ing)
      if (!norm) continue
      const e = ensure(norm)
      e.count += 1
      e.variants.push(ing)
      e.standard = true
      e.recipeNames.add(title)
    }
    for (const ing of r.special) {
      const norm = normalizeName(ing)
      if (!norm) continue
      const e = ensure(norm)
      e.count += 1
      e.variants.push(ing)
      e.special = true
      e.recipeNames.add(title)
    }
  }

  for (const ex of extras) {
    const norm = normalizeName(ex.name)
    if (!norm) continue
    const e = ensure(norm)
    e.count += 1
    e.variants.push(ex.name)
    // Treat extras as standard-only
    e.standard = true
    if (ex.source === 'favourite') e.fromFavourite = true
  }

  const items: AggregatedUnifiedItem[] = [...map.entries()]
    .map(([norm, e]) => ({
      norm,
      count: e.count,
      name: chooseDisplayName(norm, e.variants.length ? e.variants : [titleCaseFromNormalized(norm)]),
      sources: {
        standard: e.standard,
        special: e.special,
        fromFavourite: e.fromFavourite,
        recipeNames: Array.from(e.recipeNames).sort((a, b) => a.localeCompare(b)),
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return items
}
