import React from 'react'

type Props = { size?: number; stroke?: number; progress: number; ariaLabel?: string }
export function ProgressRing({ size = 28, stroke = 3, progress, ariaLabel }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))
  const offset = circumference * (1 - clamped)
  return (
    <svg width={size} height={size} role={ariaLabel ? 'img' : 'presentation'} aria-label={ariaLabel}>
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="progress-ring"
        stroke="var(--accent-600)"
        fill="transparent"
        strokeLinecap="round"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: offset }}
      />
    </svg>
  )
}
