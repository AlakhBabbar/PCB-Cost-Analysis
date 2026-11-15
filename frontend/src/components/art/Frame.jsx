export const ACCENT = 'var(--color-accent)'

// Shared monoline canvas: grey strokes in currentColor, accent strokes draw in on mount.
export default function Frame({ size = 148, label, children, className = '' }) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      className={`text-[#b9b9b3] ${className}`}
    >
      {children}
    </svg>
  )
}

export function Accent({ d, width = 1.75, draw = true }) {
  return <path d={d} stroke={ACCENT} strokeWidth={width} pathLength={draw ? 1 : undefined} className={draw ? 'art-draw' : undefined} />
}

export function Pad({ x, y, r = 2.5, accent }) {
  return <circle cx={x} cy={y} r={r} stroke={accent ? ACCENT : 'currentColor'} />
}
