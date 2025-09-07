#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

function bumpPatch(version) {
  const [core, ...rest] = version.split('-')
  const parts = core.split('.').map((n) => parseInt(n, 10))
  while (parts.length < 3) parts.push(0)
  parts[2] = (isFinite(parts[2]) ? parts[2] : 0) + 1
  const bumped = parts.join('.') + (rest.length ? '-' + rest.join('-') : '')
  return bumped
}

const pkgPath = path.resolve(process.cwd(), 'package.json')
const raw = fs.readFileSync(pkgPath, 'utf8')
const pkg = JSON.parse(raw)

// Only bump if there are staged changes excluding package.json itself
const staged = execSync('git diff --cached --name-only', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split(/\r?\n/).filter(Boolean)
const stagedOther = staged.filter((f) => path.normalize(f) !== 'package.json')
if (stagedOther.length === 0) {
  process.exit(0)
}

const from = pkg.version || '0.0.0'
const to = bumpPatch(from)
pkg.version = to
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

// Stage the change into the current commit
execSync('git add package.json', { stdio: 'ignore' })
console.log(`[auto-bump] version: ${from} -> ${to}`)

