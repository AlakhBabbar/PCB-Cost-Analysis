import { ChevronDown } from 'lucide-react'
import { inputClass } from '../../../../components/ui'
import { OP_GROUPS, opChip, opWord } from './words'

const Options = () => OP_GROUPS.map((g) => (
  <optgroup key={g.label} label={g.label}>
    {g.ops.map(([v]) => <option key={v} value={v}>{opWord(v)}</option>)}
  </optgroup>
))

// A native select drawn as a small chip: the chip shows the symbol, the list shows the words.
export default function OpSelect({ value, onChange, full, id }) {
  if (full) {
    return (
      <div className="relative">
        <select id={id} className={`${inputClass} appearance-none pr-9`} value={value} onChange={(e) => onChange(e.target.value)}><Options /></select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      </div>
    )
  }
  const sym = opChip(value)
  return (
    <span className="relative inline-flex h-8 md:h-7 items-center rounded-md px-1.5 text-[13px] font-medium text-muted hover:bg-sunken hover:text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/35">
      <span aria-hidden="true" className={sym.length === 1 ? 'text-[15px] font-semibold text-ink' : ''}>{sym}</span>
      <select aria-label="How these join" value={value} onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"><Options /></select>
    </span>
  )
}
