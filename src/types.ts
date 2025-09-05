export type IngredientName = string

export type Recipe = {
  id: string
  title: string
  standard: IngredientName[]
  special: IngredientName[]
  createdAt: string
  updatedAt: string
}

export type ExtraItem = { name: IngredientName; section: 'standard' | 'special' }

export type SavedList = {
  id: string
  name: string
  recipeIds: string[]
  extras: ExtraItem[]
  checkedNames: string[] // normalized names
  createdAt: string
  updatedAt: string
  schemaVersion: 1
}

export type StorageSchemaV1 = {
  schemaVersion: 1
  recipes: Recipe[]
  savedLists: SavedList[]
  favourites?: ExtraItem[]
}

export type StorageSchema = StorageSchemaV1
