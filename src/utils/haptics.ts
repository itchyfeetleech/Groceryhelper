export type Haptic = 'light' | 'medium' | 'heavy'

export function haptic(kind: Haptic) {
  try {
    const n = navigator as any
    if (!('vibrate' in n)) return
    const map: Record<Haptic, number | number[]> = {
      light: 10,
      medium: [15, 8, 15],
      heavy: [20, 12, 20],
    }
    n.vibrate(map[kind])
  } catch {}
}

