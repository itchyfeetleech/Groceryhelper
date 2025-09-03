export function normalizeName(s: string): string {
  return s.trim().toLowerCase()
}

export function isBlank(s: string): boolean {
  return normalizeName(s) === ''
}

export function titleCaseFromNormalized(norm: string): string {
  return norm
    .split(/\s+/)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function chooseDisplayName(norm: string, variants: string[]): string {
  if (!variants.length) return titleCaseFromNormalized(norm)
  const counts = new Map<string, number>()
  for (const v of variants) counts.set(v, (counts.get(v) ?? 0) + 1)
  // Choose most common; tie-breaker: longest; then alphabetical
  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    if (b[0].length !== a[0].length) return b[0].length - a[0].length
    return a[0].localeCompare(b[0])
  })
  return sorted[0]?.[0] ?? titleCaseFromNormalized(norm)
}

