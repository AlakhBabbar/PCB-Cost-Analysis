import { linePath } from './chartMath'

export default function Sparkline({ data = [], className = 'h-8 w-24 text-accent' }) {
  const values = data.map((d) => (typeof d === 'number' ? d : d.value ?? 0))
  if (values.length < 2) return null
  const { line, area } = linePath(values, 100, 30, 3)
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={area} fill="currentColor" opacity="0.08" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
