import { focusRing } from './styles'

// Wrapping choice buttons. options: strings or { value, label, color }
export default function ToggleGroup({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'h-10 md:h-8 px-2.5 text-[13px] md:text-xs' : 'h-11 md:h-9 px-3.5 text-[15px] md:text-sm'
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((opt) => {
        const key = typeof opt === 'object' ? opt.value : opt
        const label = typeof opt === 'object' ? opt.label : opt
        const color = typeof opt === 'object' ? opt.color : null
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`press inline-flex items-center gap-2 rounded-lg border font-medium ${pad} ${focusRing} ${
              active ? 'bg-ink border-ink text-white' : 'bg-white border-line text-ink shadow-hair hover:border-line-strong'
            }`}
          >
            {color && <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: color }} />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
