import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(value: number, duration = 200) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)

  useEffect(() => {
    const from = displayRef.current
    const to = value
    if (from === to) return
    let start: number | null = null
    let raf: number
    const step = (t: number) => {
      if (start == null) start = t
      const p = Math.min(1, (t - start) / duration)
      const v = Math.round(from + (to - from) * p)
      displayRef.current = v
      setDisplay(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}
