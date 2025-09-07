import { defineConfig } from 'vitest/config'
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'

// Determine base path for GitHub Pages automatically if env provided
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.pop() ?? ''
const base = repoName ? `/${repoName}/` : '/'

// Compose version with short git SHA for easy verification in Settings
const pkgVersion = process.env.npm_package_version || 'dev'
let gitSha = ''
try { gitSha = execSync('git rev-parse --short HEAD').toString().trim() } catch {}
const appVersion = gitSha ? `${pkgVersion}+${gitSha}` : pkgVersion

export default defineConfig({
  plugins: [react()],
  base,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
})
