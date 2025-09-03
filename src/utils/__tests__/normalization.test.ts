import { test, expect } from 'vitest'
import { chooseDisplayName, normalizeName, titleCaseFromNormalized } from '../normalization'

test('normalizeName trims and lowercases', () => {
  expect(normalizeName('  Flour ')).toBe('flour')
})

test('titleCaseFromNormalized', () => {
  expect(titleCaseFromNormalized('flour')).toBe('Flour')
  expect(titleCaseFromNormalized('brown sugar')).toBe('Brown Sugar')
})

test('chooseDisplayName uses most common variant', () => {
  const norm = 'flour'
  expect(chooseDisplayName(norm, ['flour', 'Flour', 'FLOUR', 'Flour'])).toBe('Flour')
})
