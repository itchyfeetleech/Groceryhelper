import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Determine base path for GitHub Pages automatically if env provided
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.pop() ?? ''
const base = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
})
