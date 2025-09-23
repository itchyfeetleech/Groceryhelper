import { create } from 'zustand'
import type { ExtraItem, Recipe, SavedList, StorageSchema } from '../types'
import { loadStorage, saveStorage } from '../utils/storage'
import { queueRemoteSave, bumpLocalUpdatedAt } from '../sync'
import { normalizeName } from '../utils/normalization'
import { uid } from '../utils/id'

export const AUTO_LIST_ID = 'auto-list'

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
  replaceCheckedNames: (names: string[]) => void
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

  // External hydration
  hydrateFromExternal: (data: StorageSchema) => void

  // Import/Export
  exportJSON: () => string
  importJSON: (json: string) => void
}

const persisted: StorageSchema = loadStorage()

function cloneSavedList(list: SavedList): SavedList {
  return {
    ...list,
    extras: Array.isArray(list.extras) ? list.extras.map((e) => ({ ...e })) : [],
    checkedNames: Array.isArray(list.checkedNames) ? [...list.checkedNames] : [],
  }
}

function parseIso(value: string | undefined): number {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isNaN(time) ? 0 : time
}

function prepareSavedLists(lists: SavedList[] | undefined): { savedLists: SavedList[]; autoList?: SavedList } {
  const manual: SavedList[] = []
  let latestAuto: SavedList | undefined

  if (Array.isArray(lists)) {
    for (const raw of lists) {
      if (!raw) continue
      const clone = cloneSavedList(raw)
      const isAutoCandidate = !!clone.auto || clone.id === AUTO_LIST_ID
      if (isAutoCandidate) {
        if (!latestAuto || parseIso(clone.updatedAt) > parseIso(latestAuto.updatedAt)) {
          latestAuto = { ...clone, id: AUTO_LIST_ID, auto: true }
        }
      } else {
        if (clone.auto) clone.auto = undefined
        manual.push(clone)
      }
    }
  }

  const savedLists = latestAuto ? [...manual, latestAuto] : manual
  return { savedLists, autoList: latestAuto }
}

function normalizeCheckedNamesList(names: string[]): string[] {
  const normalized: string[] = []
  for (const raw of names ?? []) {
    const norm = normalizeName(raw)
    if (!norm) continue
    if (!normalized.includes(norm)) normalized.push(norm)
  }
  return normalized
}

const prepared = prepareSavedLists(persisted.savedLists)

export const useStore = create<StoreState>((set, get) => {
  const autoSave = () => {
    const state = get()
    const now = new Date()
    const existing = state.savedLists.find((l) => l.auto || l.id === AUTO_LIST_ID)
    const createdAt = existing?.createdAt ?? now.toISOString()
    const normalizedChecks = normalizeCheckedNamesList(state.checkedNames)

    const toSave: SavedList = {
      id: AUTO_LIST_ID,
      name: `Auto-saved ${now.toLocaleString()}`,
      recipeIds: [...state.selectedRecipeIds],
      extras: state.extras.map((e) => ({ ...e })),
      checkedNames: normalizedChecks,
      createdAt,
      updatedAt: now.toISOString(),
      schemaVersion: 1,
      auto: true,
    }

    set((s) => {
      const hasAuto = s.savedLists.some((l) => l.auto || l.id === AUTO_LIST_ID)
      return {
        savedLists: hasAuto
          ? s.savedLists.map((l) => (l.auto || l.id === AUTO_LIST_ID ? toSave : l))
          : [...s.savedLists, toSave],
      }
    })
    persist()
  }

  const applyExternal = (data: StorageSchema) => {
    const { savedLists, autoList } = prepareSavedLists(data.savedLists ?? [])
    set({
      recipes: data.recipes ?? [],
      savedLists,
      favourites: (data.favourites ?? []).map((f) => ({ name: f.name, section: 'standard' as const })),
      selectedRecipeIds: autoList ? [...autoList.recipeIds] : [],
      extras: autoList ? autoList.extras.map((e) => ({ ...e })) : [],
      checkedNames: autoList ? normalizeCheckedNamesList(autoList.checkedNames) : [],
      currentListId: undefined,
    })
  }

  return {
    recipes: persisted.recipes,
    savedLists: prepared.savedLists,
    favourites: (persisted.favourites ?? []).map((f) => ({ name: f.name, section: 'standard' as const })),
    selectedRecipeIds: prepared.autoList ? [...prepared.autoList.recipeIds] : [],
    extras: prepared.autoList ? prepared.autoList.extras.map((e) => ({ ...e })) : [],
    checkedNames: prepared.autoList ? normalizeCheckedNamesList(prepared.autoList.checkedNames) : [],
    currentListId: undefined,

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
      const prevSelected = get().selectedRecipeIds
      if (prevSelected.includes(id)) {
        set({ selectedRecipeIds: prevSelected.filter((rid) => rid !== id) })
        autoSave()
      }
      persist()
    },

    setSelectedRecipeIds: (ids) => {
      const uniq: string[] = []
      for (const id of ids) if (!uniq.includes(id)) uniq.push(id)
      const prev = get().selectedRecipeIds
      const same = prev.length === uniq.length && prev.every((v, idx) => v === uniq[idx])
      if (same) return
      set({ selectedRecipeIds: uniq })
      autoSave()
    },
    addExtra: (item) => {
      const norm = normalizeName(item.name)
      if (!norm) return
      const section: 'standard' | 'special' = 'standard'
      const exists = get().extras.some((e) => normalizeName(e.name) === norm && e.section === section)
      if (exists) return
      const source = item.source ?? 'manual'
      set((s) => ({ extras: [...s.extras, { name: item.name.trim(), section, source }] }))
      autoSave()
    },
    removeExtra: (normName, section) => {
      const existed = get().extras.some((e) => normalizeName(e.name) === normName && e.section === section)
      if (!existed) return
      set((s) => ({
        extras: s.extras.filter((e) => !(normalizeName(e.name) === normName && e.section === section)),
      }))
      autoSave()
    },
    toggleChecked: (normName) => {
      const has = get().checkedNames.includes(normName)
      set((s) => ({
        checkedNames: has ? s.checkedNames.filter((n) => n !== normName) : [...s.checkedNames, normName],
      }))
      autoSave()
    },
    replaceCheckedNames: (names) => {
      const normalized = normalizeCheckedNamesList(names)
      const prev = get().checkedNames
      const same = prev.length === normalized.length && prev.every((v, idx) => v === normalized[idx])
      if (same) return
      set({ checkedNames: normalized })
      autoSave()
    },
    clearChecks: () => {
      if (get().checkedNames.length === 0) return
      set({ checkedNames: [] })
      autoSave()
    },

    clearCurrentList: () => {
      const state = get()
      if (
        state.selectedRecipeIds.length === 0 &&
        state.extras.length === 0 &&
        state.checkedNames.length === 0 &&
        !state.currentListId
      ) {
        return
      }
      set({ selectedRecipeIds: [], extras: [], checkedNames: [], currentListId: undefined })
      autoSave()
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
      const baseId = state.currentListId && state.currentListId !== AUTO_LIST_ID ? state.currentListId : uid('list')
      const normalizedChecks = normalizeCheckedNamesList(state.checkedNames)
      const existing = state.savedLists.find((l) => l.id === baseId)
      const toSave: SavedList = {
        id: baseId,
        name,
        recipeIds: [...state.selectedRecipeIds],
        extras: state.extras.map((e) => ({ ...e })),
        checkedNames: normalizedChecks,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        schemaVersion: 1,
      }
      set((s) => ({
        savedLists: s.savedLists.some((l) => l.id === baseId)
          ? s.savedLists.map((l) => (l.id === baseId ? toSave : l))
          : [...s.savedLists, toSave],
        currentListId: baseId,
      }))
      persist()
      return baseId
    },
    loadSavedList: (id) => {
      if (id === AUTO_LIST_ID) return
      const l = get().savedLists.find((x) => x.id === id)
      if (!l) return
      set({
        currentListId: id,
        selectedRecipeIds: [...l.recipeIds],
        extras: l.extras.map((e) => ({ ...e })),
        checkedNames: normalizeCheckedNamesList(l.checkedNames),
      })
      autoSave()
    },
    deleteSavedList: (id) => {
      if (id === AUTO_LIST_ID) return
      set((s) => ({ savedLists: s.savedLists.filter((l) => l.id !== id) }))
      if (get().currentListId === id) set({ currentListId: undefined })
      persist()
    },

    hydrateFromExternal: (data) => {
      applyExternal(data)
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
      applyExternal(parsed)
      persist()
    },
  }
})

function persist() {
  const s = useStore.getState()
  const data = { schemaVersion: 1 as const, recipes: s.recipes, savedLists: s.savedLists, favourites: s.favourites }
  bumpLocalUpdatedAt()
  saveStorage(data)
  queueRemoteSave(data)
}
