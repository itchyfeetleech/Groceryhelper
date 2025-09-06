# Grocery Helper — Recipe & Grocery Aggregator

Store recipes and generate aggregated grocery lists. 100% static web app (React + TypeScript + Vite), data saved locally in your browser with optional cloud sync. Deploys automatically to GitHub Pages.

## Features

- Recipes: create, edit, delete with two sections per recipe: Standard and Special.
- Ingredients are names only (no measurements). Prevent duplicates per section (case-insensitive; trims whitespace).
- Groceries: select multiple recipes to generate one unified list. Aggregates identical names to show `name x count`, with source badges (Standard/Special/Favourite) and recipe-origin chips.
- Extras: add additional items at list time; extras aggregate with recipe items. Remove extras inline.
- Favourites: save frequently bought items and toggle them into the current week’s list with one tap.
- Saved lists: save/load/delete named lists that store recipeIds, extras, and checked items. Recompute from latest recipes on load.
- Check off items inline; clear checks; swipe gestures on touch (right to check, left to remove extras).
- Virtualized list for large lists (120+ items) using react-window for smooth scrolling.
- Optional cloud sync via Firebase (anonymous sign-in + Google sign-in), with offline persistence and conflict resolution by timestamp.
- Import/Export JSON backup in Settings.
- Responsive and touch-friendly; basic keyboard support (Enter to add, Delete to remove); haptic + confetti celebration on completion (APK mode).

## Tech

- React + TypeScript + Vite
- Zustand for state
- Tailwind CSS for styling
- React Router (`/recipes`, `/items`, `/groceries`, `/settings`)
- react-window (virtualized list) and react-swipeable (gestures)
- Optional Firebase (Auth + Firestore) for sync
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

## Optional Sync (Firebase)

Sync is off by default. To enable, create a Firebase project and configure Auth + Firestore, then provide Vite env vars.

1) In Firebase Console:

- Enable Authentication: Anonymous sign-in and Google sign-in.
- Enable Cloud Firestore (in Native mode). Use secure rules that require `request.auth != null`.

2) Create `.env.local` in the project root with your web app config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...  # optional
```

3) Start the dev server. Visit Settings → Sync to sign in. Data syncs to `users/{uid}/state/app` in Firestore with offline persistence. On first connect, the app chooses the newer of local vs remote by timestamp.

To disable sync, remove env vars and rebuild.

## Android (APK/TWA) Mode

The UI adapts when running as an Android Trusted Web Activity (or when launched with `?apk=1`):

- Bottom navigation with route swipe (left/right) on touch.
- Grocery list keeps the screen awake while open (Wake Lock API where available).
- Add-individual-item bar is simplified; completion triggers haptic feedback + confetti.

APK mode is auto-detected via referrer/package id or URL param and persisted in `localStorage`.

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
type ExtraSource = 'favourite' | 'manual'
type ExtraItem = { name: IngredientName; section: 'standard' | 'special'; source?: ExtraSource }
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
type StorageSchema = {
  schemaVersion: 1
  recipes: Recipe[]
  savedLists: SavedList[]
  favourites?: ExtraItem[]
}
```

Normalization rules:

- Normalize keys by `trim + toLowerCase`.
- Aggregate counts by normalized name.
- Display name uses most common casing entered, otherwise title-cased.
- Prevent duplicates within a recipe section and within extras by normalized name.

Aggregation:

- Build name → entry map with counts and variants across Standard/Special/Favourite sources.
- +1 per ingredient occurrence in selected recipes; +1 per extra.
- Output sorted alphabetically.

Saved list behavior:

- Saved list stores the set of `recipeIds` and `extras`, plus `checkedNames`.
- On load or recipe set change, recompute from current recipes, merge extras, then restore checked flags by normalized name.

## Accessibility

- Labels for inputs and clear button text.
- Keyboard-friendly: Enter to add ingredient or extra; Delete buttons for removal.
- `aria-live` polite announcements for list recompute and focused updates.

## Acceptance Tests Checklist

- Aggregation: A(flour|saffron) + B(flour,sugar|vanilla) → Standard: flour x2, sugar x1; Special: saffron x1, vanilla x1.
- Case-insensitivity: "Flour" and "flour " aggregate to flour x2.
- Extras: adding extra "flour" to Standard increases count accordingly; removing extra decrements.
- Favourites: adding/removing favourites reflects in Items and Groceries; toggling “This week” includes/removes extras.
- Unified list: source badges (Standard/Special/Favourite) appear; up to 2 recipe chips + “+N recipes”.
- Virtualization: lists with >120 items render via react-window without visual regressions; fallback path renders normally.
- Saved lists: load after editing recipes recomputes counts; extras persist; checked items restored by normalized name.
- APK mode: route swipe works; screen stays awake on Groceries; completion shows haptic + confetti when all items checked.
- CRUD: create, edit, delete recipes and saved lists.
- Persistence: data remains after refresh (localStorage), and sync applies when configured.
- Mobile layout: usable at 360px width; inputs/buttons reachable.

## License

MIT - see `LICENSE`.

