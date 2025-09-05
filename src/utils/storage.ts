import type { StorageSchema } from '../types'

const KEY = 'recipe-grocery-aggregator:v1'

export function loadStorage(): StorageSchema {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { schemaVersion: 1, recipes: [], savedLists: [], favourites: [] }
    const parsed = JSON.parse(raw)
    // rudimentary schema check
    if (parsed && typeof parsed === 'object' && parsed.schemaVersion === 1) {
      return {
        schemaVersion: 1,
        recipes: parsed.recipes ?? [],
        savedLists: parsed.savedLists ?? [],
        favourites: parsed.favourites ?? [],
      }
    }
  } catch (e) {
    console.warn('Failed to parse storage; resetting', e)
  }
  return { schemaVersion: 1, recipes: [], savedLists: [], favourites: [] }
}

export function saveStorage(data: StorageSchema) {
  const safe: StorageSchema = {
    schemaVersion: 1,
    recipes: data.recipes ?? [],
    savedLists: data.savedLists ?? [],
    favourites: data.favourites ?? [],
  }
  localStorage.setItem(KEY, JSON.stringify(safe))
}
