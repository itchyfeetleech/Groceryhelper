var _a, _b, _c;
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
// Determine base path for GitHub Pages automatically if env provided
var repoName = (_c = (_b = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split('/')) === null || _b === void 0 ? void 0 : _b.pop()) !== null && _c !== void 0 ? _c : '';
var base = repoName ? "/".concat(repoName, "/") : '/';
export default defineConfig({
    plugins: [react()],
    base: base,
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts']
    }
});
