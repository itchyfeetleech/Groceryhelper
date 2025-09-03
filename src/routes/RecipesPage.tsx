import { RecipeList } from '../components/RecipeList'

export function RecipesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Recipes</h1>
      <RecipeList />
    </div>
  )
}

