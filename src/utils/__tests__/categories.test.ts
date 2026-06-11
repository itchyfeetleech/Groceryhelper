import { expect, test } from 'vitest'
import { CATEGORIES, groupByCategory, isKnownCategory } from '../categories'

test('groups follow aisle walking order with uncategorized last', () => {
  const items = [
    { norm: 'milk', category: 'Dairy & Eggs' },
    { norm: 'apples', category: 'Produce' },
    { norm: 'mystery', category: undefined },
    { norm: 'bread', category: 'Bakery' },
  ]
  const groups = groupByCategory(items)
  expect(groups.map((g) => g.category)).toEqual(['Produce', 'Bakery', 'Dairy & Eggs', null])
  expect(groups[3]!.items.map((i) => i.norm)).toEqual(['mystery'])
})

test('unknown categories are treated as uncategorized', () => {
  const groups = groupByCategory([{ norm: 'thing', category: 'Not A Real Aisle' }])
  expect(groups).toHaveLength(1)
  expect(groups[0]!.category).toBeNull()
})

test('empty groups are omitted and empty input yields no groups', () => {
  expect(groupByCategory([])).toEqual([])
  const groups = groupByCategory([{ norm: 'apples', category: 'Produce' }])
  expect(groups).toHaveLength(1)
  expect(groups[0]!.category).toBe('Produce')
})

test('item order within a group is preserved', () => {
  const items = [
    { norm: 'b', category: 'Pantry' },
    { norm: 'a', category: 'Pantry' },
  ]
  const groups = groupByCategory(items)
  expect(groups[0]!.items.map((i) => i.norm)).toEqual(['b', 'a'])
})

test('isKnownCategory accepts only defined aisles', () => {
  expect(isKnownCategory(CATEGORIES[0])).toBe(true)
  expect(isKnownCategory('Garage')).toBe(false)
  expect(isKnownCategory(undefined)).toBe(false)
})
