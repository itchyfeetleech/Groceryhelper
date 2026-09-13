import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecipeList } from '../RecipeList'
import { GroceryListView } from '../GroceryListView'
import { SettingsPage } from '../../routes/SettingsPage'
import { ToastProvider } from '../../ui/Toast'
import { useStore } from '../../state/store'
import type { Recipe } from '../../types'

const recipe: Recipe = { id: 'test-recipe', title: 'Dinner', standard: ['Rice'], special: ['Salmon'], createdAt: '2026-09-13', updatedAt: '2026-09-13' }
function show(ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/recipes']}><ToastProvider>{ui}</ToastProvider></MemoryRouter>)
}
beforeEach(() => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  useStore.setState({ recipes: [recipe], selectedRecipeIds: ['test-recipe'], extras: [], checkedNames: [], savedLists: [], favourites: [], categories: {}, hideChecked: false, groupByAisle: true })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Recipe pages', () => {
  it('commits edits only on Save, and discards unsaved edits when leaving', () => {
    show(<RecipeList />)
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Dinner' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved dinner' } })
    expect(useStore.getState().recipes[0]?.title).toBe('Dinner')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Dinner' }))
    expect(screen.getByLabelText('Title')).toHaveValue('Dinner')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated dinner' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(useStore.getState().recipes[0]?.title).toBe('Updated dinner')
    expect(screen.getByRole('heading', { name: 'Recipes' })).toBeInTheDocument()
  })
  it('creates no saved draft until Save and retains the New recipe heading while typing', () => {
    show(<RecipeList />)
    fireEvent.click(screen.getByRole('button', { name: 'New Recipe' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Lunch' } })
    fireEvent.change(screen.getByLabelText('Add staple ingredient'), { target: { value: 'Eggs' } })
    fireEvent.keyDown(screen.getByLabelText('Add staple ingredient'), { key: 'Enter' })
    expect(screen.getByRole('heading', { name: 'New recipe' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Move .* up/ })).not.toBeInTheDocument()
    expect(useStore.getState().recipes).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(useStore.getState().recipes.find((r) => r.title === 'Lunch')?.standard).toEqual(['Eggs'])
  })
  it('keeps confirmation for deleting from the editor', () => {
    show(<RecipeList />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit Dinner' }))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }))
    expect(useStore.getState().recipes).toHaveLength(1)
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }))
    expect(useStore.getState().recipes).toHaveLength(0)
    expect(useStore.getState().selectedRecipeIds).toEqual([])
  })
})

it('filters to staples, preserves checks when showing all items, and keeps non-staples off the filtered list', () => {
  show(<GroceryListView />)
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show only staple items' }))
  expect(screen.queryByRole('checkbox', { name: 'Check Salmon' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Check Rice' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show only staple items' }))
  expect(screen.getByRole('checkbox', { name: 'Check Rice' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Check Salmon' })).not.toBeChecked()
})

it('applies saved display settings after returning from Settings', () => {
  const view = show(<SettingsPage />)
  fireEvent.click(screen.getByRole('checkbox', { name: 'Hide checked' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show aisles' }))
  expect(localStorage.getItem('hideChecked')).toBe('1')
  expect(localStorage.getItem('groupByAisle')).toBe('0')
  view.unmount()
  useStore.setState({ checkedNames: ['rice'] })
  show(<GroceryListView />)
  expect(screen.getByRole('checkbox', { name: 'Check Rice' }).closest('details')).not.toHaveAttribute('open')
  expect(screen.getByRole('checkbox', { name: 'Check Salmon' })).toBeInTheDocument()
  expect(screen.getByText('Completed (1)')).toBeInTheDocument()
})
