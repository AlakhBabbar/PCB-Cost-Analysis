import { focusRing } from './styles'

// options: [{ value, label, count? }]. multiple: value is an array.
export default function FilterChips({ options, value, onChange, multiple, label, className = '' }) {
  const on = (v) => (multiple ? value?.includes(v) : value === v)
  const pick = (v) => {
    if (!multiple) return onChange(v)
    onChange(on(v) ? value.filter((x) => x !== v) : [...(value ?? []), v])
  }
  return (
    <div role="group" aria-label={label} className={`no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 ${className}`}>
      {options.map(({ value: v, label: text, count }) => (
        <button
          key={v}
          type="button"
          aria-pressed={on(v)}
          onClick={() => pick(v)}
          className={`press inline-flex h-9 md:h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[14px] md:text-[13px] font-medium whitespace-nowrap ${focusRing} ${
            on(v) ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted hover:border-line-strong hover:text-ink'
          }`}
        >
          {text}
          {count != null && <span className={`tabular-nums ${on(v) ? 'text-white/70' : 'text-faint'}`}>{count}</span>}
        </button>
      ))}
    </div>
  )
}
