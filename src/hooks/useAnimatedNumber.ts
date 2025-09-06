import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(value: number, duration = 200) {
  const [display, setDisplay] = useState(value)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(value)
  const toRef = useRef(value)

  useEffect(() => {
    fromRef.current = display
    toRef.current = value
    startRef.current = null
    let raf: number
    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / duration)
      const v = fromRef.current + (toRef.current - fromRef.current) * p
      setDisplay(Math.round(v))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}

