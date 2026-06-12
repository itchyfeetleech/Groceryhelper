import { expect, test } from 'vitest'
import { autoAisle, resolveAisle, NO_AISLE } from '../aisleDb'

test('exact matches', () => {
  expect(autoAisle('milk')).toBe('Dairy & Eggs')
  expect(autoAisle('Bread')).toBe('Bakery')
  expect(autoAisle('  Toilet Paper ')).toBe('Household')
})

test('plurals match singular entries', () => {
  expect(autoAisle('bananas')).toBe('Produce')
  expect(autoAisle('eggs')).toBe('Dairy & Eggs')
  expect(autoAisle('chicken thighs')).toBe('Meat & Fish')
  expect(autoAisle('cherries')).toBe('Produce')
})

test('longest trailing phrase wins', () => {
  expect(autoAisle('extra virgin olive oil')).toBe('Pantry')
  expect(autoAisle('vanilla ice cream')).toBe('Frozen')
  expect(autoAisle('peanut butter')).toBe('Pantry')
  expect(autoAisle('butter')).toBe('Dairy & Eggs')
  expect(autoAisle('shaving cream')).toBe('Personal care')
  expect(autoAisle('double cream')).toBe('Dairy & Eggs')
})

test('falls back to earlier words when the tail is unknown', () => {
  expect(autoAisle('chicken skewers')).toBe('Meat & Fish')
  expect(autoAisle('salmon en croute')).toBe('Meat & Fish')
})

test('descriptive prefixes do not break matching', () => {
  expect(autoAisle('organic whole milk')).toBe('Dairy & Eggs')
  expect(autoAisle('free range eggs')).toBe('Dairy & Eggs')
  expect(autoAisle('ripe avocados')).toBe('Produce')
})

test('unknown items return undefined', () => {
  expect(autoAisle('mystery gadget')).toBeUndefined()
  expect(autoAisle('')).toBeUndefined()
})

test('resolveAisle precedence: manual > none-override > auto', () => {
  expect(resolveAisle('milk', {})).toBe('Dairy & Eggs')
  expect(resolveAisle('milk', { milk: 'Drinks' })).toBe('Drinks')
  expect(resolveAisle('milk', { milk: NO_AISLE })).toBeUndefined()
  expect(resolveAisle('mystery gadget', {})).toBeUndefined()
})
