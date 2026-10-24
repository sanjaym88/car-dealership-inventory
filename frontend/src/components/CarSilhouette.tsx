// Side view of a sports coupe, drawn in SVG so it stays crisp at any size.
// Wheels are separate groups so callers can spin them (pass animation classes via wheelClassName).
import { useId } from 'react'

function Wheel({ cx, className, testId }: { cx: number; className: string; testId?: string }) {
  return (
    <g data-testid={testId} className={`spin-origin ${className}`}>
      <circle cx={cx} cy="62" r="14" fill="#0b0f19" />
      <circle cx={cx} cy="62" r="8.5" fill="#cbd5e1" />
      {[0, 60, 120].map((angle) => (
        <rect key={angle} x={cx - 0.9} y="54" width="1.8" height="16" rx="0.9" fill="#64748b"
          transform={`rotate(${angle} ${cx} 62)`} />
      ))}
      <circle cx={cx} cy="62" r="2.2" fill="#475569" />
    </g>
  )
}

export function CarSilhouette({ wheelClassName = '', wheelTestId, color = '#e11d48', className = '' }: {
  wheelClassName?: string
  wheelTestId?: string
  color?: string
  className?: string
}) {
  const id = useId()
  return (
    <svg viewBox="0 0 220 80" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93c5fd" stopOpacity="0.9" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      {/* body */}
      <path d="M10 55 Q12 41 35 38 L72 35 Q92 18 120 16 L148 17 Q170 20 186 35 L205 39 Q215 42 215 52 L215 58 Q215 62 209 62 L12 62 Q8 62 8 58 Z"
        fill={`url(#${id}-body)`} />
      {/* windows */}
      <path d="M80 35 Q97 22 120 20.5 L146 21.5 Q161 24 173 35 Z" fill={`url(#${id}-glass)`} />
      <rect x="122" y="20" width="3" height="15" fill={color} />
      {/* door line, headlight, tail light */}
      <path d="M118 37 L116 58" stroke="#00000033" strokeWidth="1.2" />
      <ellipse cx="209" cy="45" rx="4" ry="2.5" fill="#fde68a" />
      <rect x="9" y="44" width="5" height="4" rx="1.5" fill="#f87171" />
      <Wheel cx={55} className={wheelClassName} testId={wheelTestId} />
      <Wheel cx={170} className={wheelClassName} testId={wheelTestId} />
    </svg>
  )
}
