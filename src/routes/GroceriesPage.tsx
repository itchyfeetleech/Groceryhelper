import { GroceryListView } from '../components/GroceryListView'
import { SavedListManager } from '../components/SavedListManager'
import { useStore } from '../state/store'

export function GroceriesPage() {
  const { selectedRecipeIds } = useStore()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Groceries</h1>
      <GroceryListView />
      <SavedListManager />
      {selectedRecipeIds.length === 0 && (
        <p className="text-sm text-slate-500">Select recipes to generate a grocery list.</p>
      )}
    </div>
  )
}
