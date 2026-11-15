import { TONE } from './styles'

const KEYS = [['setting', 'Your settings'], ['line', 'Earlier steps'], ['input', 'This order'], ['choice', "Buyer's choice"], ['func', 'Rounding and if']]

// What the piece colours mean, drawn from the same styles as the pieces.
export default function Legend({ className = '' }) {
  return (
    <ul aria-label="What the colours mean" className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <li className="pr-0.5 text-[12px] text-muted">Colours:</li>
      {KEYS.map(([k, label]) => (
        <li key={k} className={`inline-flex h-6 items-center rounded-md px-1.5 text-[12px] font-medium leading-none ${TONE[k].replace(/hover:\S+/g, '')}`}>{label}</li>
      ))}
    </ul>
  )
}
