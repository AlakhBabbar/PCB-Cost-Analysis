import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import CountUp from '../motion/CountUp'
import Sparkline from '../art/Sparkline'

const TONE = { default: 'text-ink', good: 'text-[#0b5a40]', bad: 'text-[#b42318]', muted: 'text-faint' }

// value: number (counts up, shown with format) or a ready string. delta: percent change.
export default function Stat({ label, value, format, delta, spark, detail, hero, tone = 'default', className = '' }) {
  const up = delta > 0
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[13px] md:text-xs font-medium text-muted">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className={`truncate font-semibold tracking-tight tabular-nums ${hero ? 'text-2xl md:text-3xl' : 'text-[22px] md:text-xl'} ${TONE[tone]}`}>
          {typeof value === 'number' ? <CountUp value={value} format={format} /> : value}
        </span>
        {spark?.length > 1 && <Sparkline data={spark} className="mb-1 hidden h-7 w-20 shrink-0 text-accent xl:block" />}
      </div>
      {(delta != null || detail) && (
        <span className="flex items-center gap-1.5 text-[13px] md:text-xs text-muted">
          {delta != null && delta !== 0 && (
            <span className={`inline-flex items-center font-medium ${up ? 'text-[#0b5a40]' : 'text-[#b42318]'}`}>
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(0)}%
            </span>
          )}
          {detail && <span className="truncate">{detail}</span>}
        </span>
      )}
    </div>
  )
}
