var _a, _b, _c;
import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
// Determine base path for GitHub Pages automatically if env provided
var repoName = (_c = (_b = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split('/')) === null || _b === void 0 ? void 0 : _b.pop()) !== null && _c !== void 0 ? _c : '';
var base = repoName ? "/".concat(repoName, "/") : '/';
// Compose version with short git SHA for Settings display
const pkgVersion = process.env.npm_package_version || 'dev';
let gitSha = '';
try { gitSha = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
const appVersion = gitSha ? `${pkgVersion}+${gitSha}` : pkgVersion;

export default defineConfig({
    plugins: [react()],
    base: base,
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts']
    }
});
