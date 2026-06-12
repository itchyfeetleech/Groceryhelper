import { RecipeList } from '../components/RecipeList'

export function RecipesPage() {
  return (
    <div className="space-y-4">
      <h1 className="page-title">Recipes</h1>
      <RecipeList />
    </div>
  )
}

