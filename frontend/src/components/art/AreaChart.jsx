import { useState } from 'react'
import { m } from 'framer-motion'
import ChartShell from './ChartShell'
import { linePath, valueOf } from './chartMath'

// data: [{ label, value }]
export default function AreaChart({ data = [], format = String, height = 160 }) {
  const [hover, setHover] = useState(null)
  if (data.length < 2) return null
  const { line, area, pts } = linePath(data.map(valueOf), 100, 100, 4)
  const at = hover ?? data.length - 1
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1))
    setHover(Math.min(data.length - 1, Math.max(0, i)))
  }
  return (
    <ChartShell data={data} hover={hover} format={format} height={height} onLeave={() => setHover(null)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full touch-pan-y" onPointerMove={move} onPointerDown={move} role="img" aria-label="Area chart">
        <path d="M0 99.5H100" stroke="var(--color-line)" vectorEffect="non-scaling-stroke" />
        <m.path d={area} fill="var(--color-accent)" initial={{ opacity: 0 }} animate={{ opacity: 0.08 }} transition={{ duration: 0.5, delay: 0.2 }} />
        <m.path
          d={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <span
        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-hair"
        style={{ left: `${pts[at][0]}%`, top: `${pts[at][1]}%` }}
      />
    </ChartShell>
  )
}
