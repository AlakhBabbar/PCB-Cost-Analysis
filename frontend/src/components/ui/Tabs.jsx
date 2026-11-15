import { useId } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { spring } from '../motion/tokens'
import { focusRing } from './styles'

// items: [{ value, label, count?, icon?, to? }]. With `to` each tab is a link.
export default function Tabs({ items, value, onChange, className = '' }) {
  const ink = useId()
  return (
    <div role="tablist" className={`no-scrollbar flex gap-1 overflow-x-auto border-b border-line ${className}`}>
      {items.map(({ value: v, label, count, icon: Icon, to }) => {
        const active = v === value
        const Tag = to ? Link : 'button'
        return (
          <Tag
            key={v}
            to={to}
            type={to ? undefined : 'button'}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(v)}
            className={`relative inline-flex h-11 md:h-10 shrink-0 items-center gap-1.5 px-2.5 text-[15px] md:text-sm font-medium whitespace-nowrap transition-colors ${active ? 'text-ink' : 'text-muted hover:text-ink'} ${focusRing} rounded-md`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
            {count != null && <span className="rounded-full bg-sunken px-1.5 text-[11px] tabular-nums text-muted">{count}</span>}
            {active && <m.span layoutId={ink} transition={spring.ink} className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-ink" />}
          </Tag>
        )
      })}
    </div>
  )
}
