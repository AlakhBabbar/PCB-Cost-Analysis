import { m } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { Card } from '../../../components/ui'
import { spring, staggerDelay } from '../../../components/motion'
import { count } from '../../../lib/format'

const STEPS = [
  ['quoted', 'Got a price'],
  ['uploaded', 'Uploaded a file'],
  ['checkout', 'Started checkout'],
  ['ordered', 'Ordered'],
  ['paid', 'Paid'],
]

const width = (v, max) => Math.max((v / max) * 100, v > 0 ? 6 : 2)

function Slice({ top, bottom, i, last }) {
  const d = `M${50 - top / 2} 0H${50 + top / 2}L${50 + bottom / 2} 100H${50 - bottom / 2}Z`
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <m.path
        d={d}
        fill={last ? 'var(--color-accent)' : '#d9d9d5'}
        fillOpacity={last ? 0.85 : 1 - i * 0.12}
        stroke="white"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ ...spring.panel, delay: staggerDelay(i) }}
      />
    </svg>
  )
}

export default function Funnel({ funnel }) {
  const values = STEPS.map(([k]) => funnel[k] ?? 0)
  const max = Math.max(values[0], ...values, 1)
  return (
    <Card title="From price to payment" description="How many buyers reached each step in the last 14 days.">
      <ol className="flex flex-col">
        {STEPS.map(([key, label], i) => {
          const v = values[i]
          const prev = values[i - 1]
          const kept = i > 0 && prev > 0 ? Math.round((v / prev) * 100) : null
          return (
            <li key={key} className="grid h-16 grid-cols-[minmax(0,8.5rem)_1fr] items-center gap-3 md:grid-cols-[11rem_1fr]">
              <div className="min-w-0">
                <p className="truncate text-[13px] md:text-xs text-muted">{label}</p>
                <p className="text-[17px] md:text-base font-semibold tabular-nums text-ink">{count(v)}</p>
                {kept != null && (
                  <p className="inline-flex items-center gap-1 text-[12px] md:text-[11px] text-faint">
                    <ArrowDown className="h-3 w-3" />{kept}% went on, {count(Math.max(prev - v, 0))} stopped
                  </p>
                )}
              </div>
              <Slice top={width(v, max)} bottom={width(values[i + 1] ?? v, max)} i={i} last={i === STEPS.length - 1} />
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
