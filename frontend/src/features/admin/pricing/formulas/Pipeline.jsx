import { CircuitBoard, Cog, IndianRupee, Landmark, Receipt, Tag, TrendingUp, Wallet } from 'lucide-react'
import { CountUp } from '../../../../components/motion'
import { useIsDesktop } from '../../../../lib/useMediaQuery'
import { inr } from '../../../../lib/format'

const STAGES = [
  { key: 'board_cost', label: 'Board cost', icon: CircuitBoard, per: 'board' },
  { key: 'unit_cost', label: 'Running costs', icon: Cog, per: 'board' },
  { key: 'cost_per_board', label: 'Cost per board', icon: Wallet, per: 'board' },
  { key: 'selling_price', label: 'Markup', icon: TrendingUp, per: 'board' },
  { key: 'bank_and_warranty', label: 'Fees', icon: Receipt, per: 'board' },
  { key: 'price_per_board', label: 'Price per board', icon: Tag, per: 'board' },
  { key: 'gst', label: 'Tax', icon: Landmark, per: 'order' },
  { key: 'total', label: 'Total', icon: IndianRupee, per: 'order' },
]

// Snake order: left to right, then right to left on the next row.
const place = (i, cols) => {
  const row = Math.floor(i / cols)
  const col = row % 2 ? cols - 1 - (i % cols) : i % cols
  return { row, col }
}

export default function Pipeline({ values, loading }) {
  const cols = useIsDesktop() ? 4 : 2
  const rows = Math.ceil(STAGES.length / cols)
  const pts = STAGES.map((_, i) => place(i, cols)).map(({ row, col }) => `${col * 100 + 50},${row * 100 + 50}`)
  const d = `M${pts.join(' L')}`
  return (
    <div className="relative" role="img" aria-label="How the price is built, stage by stage">
      <svg className="pointer-events-none absolute inset-0 h-full w-full text-line-strong" viewBox={`0 0 ${cols * 100} ${rows * 100}`} preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path d={d} stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
        <path key={cols} d={d} stroke="var(--color-accent)" strokeWidth="1.75" pathLength="1" className="art-draw" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className="relative grid gap-x-4 gap-y-5 md:gap-x-6 md:gap-y-7" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {STAGES.map((s, i) => {
          const { row, col } = place(i, cols)
          const Icon = s.icon
          const v = values?.[s.key]
          return (
            <li key={s.key} style={{ gridRow: row + 1, gridColumn: col + 1 }}
              className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-white p-3 shadow-hair">
              <span className="flex items-center gap-1.5 text-[13px] md:text-xs font-medium text-muted">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${i === STAGES.length - 1 ? 'text-accent' : ''}`} strokeWidth={1.5} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className={`truncate text-[17px] md:text-base font-semibold tabular-nums text-ink ${loading ? 'opacity-50' : ''}`}>
                {v == null ? '-' : <CountUp value={v} format={(n) => inr(n)} />}
              </span>
              <span className="text-[12px] md:text-[11px] text-faint">per {s.per}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
