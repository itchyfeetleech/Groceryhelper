import { test, expect } from 'vitest'
import { aggregate, aggregateUnified } from '../aggregate'
import type { ExtraItem, Recipe } from '../../types'

const makeRecipe = (id: string, title: string, std: string[], spc: string[]): Recipe => ({
  id,
  title,
  standard: std,
  special: spc,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

test('Aggregation basic case', () => {
  const A = makeRecipe('A', 'A', ['flour'], ['saffron'])
  const B = makeRecipe('B', 'B', ['flour', 'sugar'], ['vanilla'])
  const result = aggregate([A, B], ['A', 'B'], [])
  expect(result.standard.find((i) => i.norm === 'flour')?.count).toBe(2)
  expect(result.standard.find((i) => i.norm === 'sugar')?.count).toBe(1)
  expect(result.special.find((i) => i.norm === 'saffron')?.count).toBe(1)
  expect(result.special.find((i) => i.norm === 'vanilla')?.count).toBe(1)
})

test('Case-insensitive and trimming', () => {
  const A = makeRecipe('A', 'A', ['Flour '], [])
  const B = makeRecipe('B', 'B', [' flour'], [])
  const result = aggregate([A, B], ['A', 'B'], [])
  expect(result.standard.find((i) => i.norm === 'flour')?.count).toBe(2)
})

test('Extras aggregate', () => {
  const A = makeRecipe('A', 'A', ['flour'], [])
  const extras: ExtraItem[] = [{ name: 'flour', section: 'standard' }]
  const result = aggregate([A], ['A'], extras)
  expect(result.standard.find((i) => i.norm === 'flour')?.count).toBe(2)
})

test('Unified aggregation attaches categories by normalized name', () => {
  const A = makeRecipe('A', 'A', ['Flour'], [])
  const extras: ExtraItem[] = [{ name: 'milk', section: 'standard' }]
  const items = aggregateUnified([A], ['A'], extras, { flour: 'Snacks', milk: 'Drinks' })
  // manual assignments override the automatic database
  expect(items.find((i) => i.norm === 'flour')?.category).toBe('Snacks')
  expect(items.find((i) => i.norm === 'milk')?.category).toBe('Drinks')
  // without manual assignments, the built-in database fills them in
  const auto = aggregateUnified([A], ['A'], extras)
  expect(auto.find((i) => i.norm === 'flour')?.category).toBe('Pantry')
  expect(auto.find((i) => i.norm === 'milk')?.category).toBe('Dairy & Eggs')
})

test('Saved list recompute scenario', () => {
  const A = makeRecipe('A', 'A', ['flour'], [])
  const B1 = makeRecipe('B', 'B', ['sugar'], [])
  const B2 = makeRecipe('B', 'B', ['sugar', 'flour'], [])
  const sel = ['A', 'B']
  const extra: ExtraItem[] = [{ name: 'salt', section: 'standard' }]
  const v1 = aggregate([A, B1], sel, extra)
  expect(v1.standard.find((i) => i.norm === 'flour')?.count ?? 0).toBe(1)
  const v2 = aggregate([A, B2], sel, extra)
  expect(v2.standard.find((i) => i.norm === 'flour')?.count ?? 0).toBe(2)
})
