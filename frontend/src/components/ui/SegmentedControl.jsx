import { useId } from 'react'
import { m } from 'framer-motion'
import { spring } from '../motion/tokens'
import { focusRing } from './styles'

// options: strings or { value, label, icon? }
export default function SegmentedControl({ options, value, onChange, label, size = 'md', className = '' }) {
  const ink = useId()
  const h = size === 'sm' ? 'h-9 md:h-7 text-[13px] md:text-xs' : 'h-10 md:h-8 text-[14px] md:text-[13px]'
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-lg bg-sunken p-0.5 ${className}`}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o
        const text = typeof o === 'object' ? o.label : o
        const Icon = typeof o === 'object' ? o.icon : null
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={`relative flex-1 inline-flex items-center justify-center gap-1.5 px-3 rounded-md font-medium whitespace-nowrap transition-colors ${h} ${active ? 'text-ink' : 'text-muted hover:text-ink'} ${focusRing}`}
          >
            {active && <m.span layoutId={ink} transition={spring.ink} className="absolute inset-0 rounded-md border border-line bg-white shadow-hair" />}
            <span className="relative inline-flex items-center gap-1.5">{Icon && <Icon className="w-4 h-4" />}{text}</span>
          </button>
        )
      })}
    </div>
  )
}
