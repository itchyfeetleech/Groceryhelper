import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { RecipesPage } from './routes/RecipesPage'
import { GroceriesPage } from './routes/GroceriesPage'
import { SettingsPage } from './routes/SettingsPage'
import { ItemsPage } from './routes/ItemsPage'
import { detectApkAndPersist } from './utils/apk'

// Run APK detection as early as possible, before first render
try { detectApkAndPersist() } catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}> 
          <Route index element={<Navigate to="/recipes" replace />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="groceries" element={<GroceriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/recipes" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
