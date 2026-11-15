import { StaggerItem } from '../motion/Stagger'
import RelativeTime from './RelativeTime'

const DOT = { neutral: 'bg-[#b9b9b3]', good: 'bg-[#1a8a5c]', wait: 'bg-[#d39417]', alert: 'bg-[#d43c2b]', info: 'bg-[#3b6fc4]', accent: 'bg-accent' }

// items: [{ id, title, time (iso), detail?, tone? }] newest first.
export default function Timeline({ items, className = '' }) {
  return (
    <ol className={`relative ${className}`}>
      {items.map((it, i) => (
        <StaggerItem as="li" key={it.id ?? i} i={i} initial="hidden" animate="show" className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-line" aria-hidden="true" />}
          <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-[3px] ring-white ${DOT[it.tone] ?? DOT.neutral}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] md:text-[13px] font-medium text-ink">{it.title}</p>
              {it.time && <RelativeTime value={it.time} className="shrink-0 text-xs text-faint" />}
            </div>
            {it.detail && <div className="mt-0.5 text-[14px] md:text-xs text-muted">{it.detail}</div>}
          </div>
        </StaggerItem>
      ))}
    </ol>
  )
}
