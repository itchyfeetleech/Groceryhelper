# Recipe & Grocery Aggregator

Store recipes and generate aggregated grocery lists. 100% static web app (React + TypeScript + Vite), data saved locally in your browser. Deploys automatically to GitHub Pages.

## Features

- Recipes: create, edit, delete with two sections per recipe: Standard and Special.
- Ingredients are names only (no measurements). Prevent duplicates per section (case-insensitive, trims whitespace).
- Groceries: select multiple recipes to generate one list. Aggregates identical names to show `name × count` in each section.
- Extras: add additional items at list time to either section; extras aggregate with recipe items.
- Saved lists: save/load/delete named lists that store recipeIds, extras, and checked items. Recompute from latest recipes on load.
- Check off items inline, remove extras inline, and clear checks.
- Import/Export JSON backup in Settings.
- Responsive and touch-friendly; basic keyboard support (Enter to add, Delete to remove).
- Local persistence in `localStorage` with schema versioning for future migrations.

## Tech

- React + TypeScript + Vite
- Zustand for state
- Tailwind CSS for styling
- React Router (`/recipes`, `/groceries`, `/settings`)
- Vitest + React Testing Library for core logic tests
- ESLint + Prettier

## Getting Started

Prereqs: Node 18+.

Install and run:

```
npm install
npm run dev
```

Run tests:

```
npm test
```

Build:

```
npm run build
npm run preview
```

## Deployment (GitHub Pages)

This repo includes a GitHub Actions workflow to build and publish to the `gh-pages` branch.

Steps:

1. Push to `main` (or manually run the workflow).
2. In your repository settings, set Pages to deploy from `gh-pages` branch.
3. Vite `base` is automatically set from `GITHUB_REPOSITORY` during CI.

SPA routing is handled by copying `index.html` to `404.html` on deploy.

## Data Model

```
type IngredientName = string // stored trimmed
type Recipe = {
  id: string
  title: string
  standard: IngredientName[]
  special: IngredientName[]
  createdAt: string
  updatedAt: string
}
type ExtraItem = { name: IngredientName; section: 'standard' | 'special' }
type SavedList = {
  id: string
  name: string
  recipeIds: string[]
  extras: ExtraItem[]
  checkedNames: string[] // normalized names
  createdAt: string
  updatedAt: string
  schemaVersion: 1
}
```

Normalization rules:

- Normalize keys by `trim + toLowerCase`.
- Aggregate counts by normalized name.
- Display name uses most common casing entered, otherwise title-cased.
- Prevent duplicates within a recipe section and within extras by normalized name.

Aggregation:

- Build per-section maps of `{ normName -> { displayName, count } }`.
- +1 per ingredient occurrence in selected recipes; +1 per extra.
- Output sorted alphabetically within each section.

Saved list behavior:

- Saved list stores the set of `recipeIds` and `extras`, plus `checkedNames`.
- On load or recipe set change, recompute from current recipes, merge extras, then restore checked flags by normalized name.

## Backup (Import/Export)

- Settings → Export JSON downloads a backup file and shows it in the textarea.
- To restore: choose a JSON file or paste in the textarea, then Import.

## Accessibility

- Labels for inputs and clear button text.
- Keyboard-friendly: Enter to add ingredient or extra; Delete buttons provided for removal.
- `aria-live` polite announcements for list recompute.

## Acceptance Tests Checklist

- Aggregation: A(flour|saffron) + B(flour,sugar|vanilla) → Standard: flour ×2, sugar ×1; Special: saffron ×1, vanilla ×1.
- Case-insensitivity: “Flour” and “flour ” aggregate to flour ×2.
- Extras: adding extra “flour” to Standard increases count accordingly.
- Saved list recompute: loading saved list after editing recipes reflects updated counts; extras persist.
- Swap recipes: changing selection updates counts; checked items persist when possible.
- CRUD: create, edit, delete recipes and saved lists.
- Persistence: data remains after refresh (localStorage).
- Mobile layout: usable at 360px width; inputs/buttons reachable.

## License

MIT — see `LICENSE`.

