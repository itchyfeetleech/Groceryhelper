import { create } from 'zustand'
import type { ExtraItem, Recipe, SavedList, StorageSchema } from '../types'
import { loadStorage, saveStorage } from '../utils/storage'
import { queueRemoteSave, bumpLocalUpdatedAt } from '../sync'
import { normalizeName } from '../utils/normalization'
import { uid } from '../utils/id'

type StoreState = {
  recipes: Recipe[]
  savedLists: SavedList[]
  favourites: ExtraItem[]

  // Current groceries builder state (not persisted separately; goes into saved list)
  selectedRecipeIds: string[]
  extras: ExtraItem[]
  checkedNames: string[] // normalized
  currentListId?: string

  // Recipes
  addRecipe: (r: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateRecipe: (r: Recipe) => void
  deleteRecipe: (id: string) => void

  // Groceries builder manipulation
  setSelectedRecipeIds: (ids: string[]) => void
  addExtra: (item: ExtraItem) => void
  removeExtra: (normName: string, section: 'standard' | 'special') => void
  toggleChecked: (normName: string) => void
  clearChecks: () => void
  // Clear current in-progress grocery list (not saved lists)
  clearCurrentList: () => void

  // Favourites
  addFavourite: (item: ExtraItem) => void
  removeFavourite: (normName: string, section: 'standard' | 'special') => void

  // Saved lists
  saveCurrentAs: (name: string) => string
  loadSavedList: (id: string) => void
  deleteSavedList: (id: string) => void

  // Import/Export
  exportJSON: () => string
  importJSON: (json: string) => void
}

const persisted: StorageSchema = loadStorage()

export const useStore = create<StoreState>((set, get) => ({
  recipes: persisted.recipes,
  savedLists: persisted.savedLists,
  favourites: (persisted.favourites ?? []).map((f) => ({ name: f.name, section: 'standard' as const })),
  selectedRecipeIds: [],
  extras: [],
  checkedNames: [],

  addRecipe: (data) => {
    const now = new Date().toISOString()
    const id = uid('r')
    const recipe: Recipe = { id, createdAt: now, updatedAt: now, ...data }
    set((s) => ({ recipes: [...s.recipes, recipe] }))
    persist()
    return id
  },
  updateRecipe: (r) => {
    const now = new Date().toISOString()
    set((s) => ({
      recipes: s.recipes.map((x) => (x.id === r.id ? { ...r, updatedAt: now } : x)),
    }))
    persist()
  },
  deleteRecipe: (id) => {
    set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) }))
    // If the current selection references this recipe, drop it
    set((s) => ({ selectedRecipeIds: s.selectedRecipeIds.filter((rid) => rid !== id) }))
    // No direct recompute stored; checked names might include items that disappear; that's OK
    persist()
  },

  setSelectedRecipeIds: (ids) => {
    // Normalize to unique list preserving order
    const uniq: string[] = []
    for (const id of ids) if (!uniq.includes(id)) uniq.push(id)
    set({ selectedRecipeIds: uniq })
    // Drop checks for items that no longer exist will happen in view; we also prune checks on save
  },
  addExtra: (item) => {
    const norm = normalizeName(item.name)
    if (!norm) return
    const section: 'standard' | 'special' = 'standard'
    const exists = get().extras.some((e) => normalizeName(e.name) === norm && e.section === section)
    if (exists) return
    const source = item.source ?? 'manual'
    set((s) => ({ extras: [...s.extras, { name: item.name.trim(), section, source }] }))
  },
  removeExtra: (normName, section) => {
    set((s) => ({
      extras: s.extras.filter((e) => !(normalizeName(e.name) === normName && e.section === section)),
    }))
  },
  toggleChecked: (normName) => {
    set((s) => ({
      checkedNames: s.checkedNames.includes(normName)
        ? s.checkedNames.filter((n) => n !== normName)
        : [...s.checkedNames, normName],
    }))
  },
  clearChecks: () => set({ checkedNames: [] }),

  clearCurrentList: () => {
    set({ selectedRecipeIds: [], extras: [], checkedNames: [], currentListId: undefined })
  },

  addFavourite: (item) => {
    const norm = normalizeName(item.name)
    if (!norm) return
    const section: 'standard' | 'special' = 'standard'
    const exists = get().favourites.some((e) => normalizeName(e.name) === norm && e.section === section)
    if (exists) return
    set((s) => ({ favourites: [...s.favourites, { name: item.name.trim(), section }] }))
    persist()
  },
  removeFavourite: (normName, section) => {
    set((s) => ({
      favourites: s.favourites.filter((e) => !(normalizeName(e.name) === normName && e.section === section)),
    }))
    persist()
  },

  saveCurrentAs: (name) => {
    const now = new Date().toISOString()
    const state = get()
    const id = state.currentListId ?? uid('list')
    const toSave: SavedList = {
      id,
      name,
      recipeIds: state.selectedRecipeIds,
      extras: state.extras,
      checkedNames: [...new Set(state.checkedNames.map(normalizeName))],
      createdAt: state.currentListId ? (state.savedLists.find((l) => l.id === id)?.createdAt ?? now) : now,
      updatedAt: now,
      schemaVersion: 1,
    }
    set((s) => ({
      savedLists: s.savedLists.some((l) => l.id === id)
        ? s.savedLists.map((l) => (l.id === id ? toSave : l))
        : [...s.savedLists, toSave],
      currentListId: id,
    }))
    persist()
    return id
  },
  loadSavedList: (id) => {
    const l = get().savedLists.find((x) => x.id === id)
    if (!l) return
    set({
      currentListId: id,
      selectedRecipeIds: l.recipeIds,
      extras: l.extras,
      checkedNames: l.checkedNames.map(normalizeName),
    })
  },
  deleteSavedList: (id) => {
    set((s) => ({ savedLists: s.savedLists.filter((l) => l.id !== id) }))
    if (get().currentListId === id) set({ currentListId: undefined })
    persist()
  },

  exportJSON: () => {
    const data: StorageSchema = {
      schemaVersion: 1,
      recipes: get().recipes,
      savedLists: get().savedLists,
      favourites: get().favourites,
    }
    return JSON.stringify(data, null, 2)
  },
  importJSON: (json: string) => {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1) {
      throw new Error('Invalid or unsupported backup file')
    }
    set({
      recipes: parsed.recipes ?? [],
      savedLists: parsed.savedLists ?? [],
      favourites: (parsed.favourites ?? []).map((f: ExtraItem) => ({ name: f.name, section: 'standard' as const })),
      selectedRecipeIds: [],
      extras: [],
      checkedNames: [],
      currentListId: undefined,
    })
    persist()
  },
}))

function persist() {
  const s = useStore.getState()
  const data = { schemaVersion: 1 as const, recipes: s.recipes, savedLists: s.savedLists, favourites: s.favourites }
  bumpLocalUpdatedAt()
  saveStorage(data)
  queueRemoteSave(data)
}
