import { inr, inrCompact, inrRound } from '../../lib/format'

export default function Money({ value, compact, round, digits = 2, muted, className = '' }) {
  const text = compact ? inrCompact(value) : round ? inrRound(value) : inr(value, digits)
  return <span className={`tabular-nums whitespace-nowrap ${muted ? 'text-muted' : ''} ${className}`}>{text}</span>
}
