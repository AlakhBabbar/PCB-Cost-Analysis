import { useState } from 'react'
import { m } from 'framer-motion'
import { spring, staggerDelay } from '../motion/tokens'
import ChartShell from './ChartShell'
import { valueOf } from './chartMath'

// data: [{ label, value }]
export default function BarChart({ data = [], format = String, height = 160 }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data.map(valueOf), 1)
  const w = data.length * 10
  return (
    <ChartShell data={data} hover={hover} format={format} height={height} onLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Bar chart">
        <path d={`M0 99.5H${w}`} stroke="var(--color-line)" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = Math.max((valueOf(d) / max) * 96, valueOf(d) > 0 ? 2 : 0.6)
          const on = hover === i || (hover == null && i === data.length - 1)
          return (
            <g key={d.label ?? i} onPointerEnter={() => setHover(i)}>
              <rect x={i * 10} y="0" width="10" height="100" fill="transparent" />
              <m.rect
                x={i * 10 + 2}
                y={100 - h}
                width="6"
                height={h}
                rx="1"
                fill={on ? 'var(--color-accent)' : '#d9d9d5'}
                style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...spring.row, delay: staggerDelay(i) / 2 }}
              />
            </g>
          )
        })}
      </svg>
    </ChartShell>
  )
}
