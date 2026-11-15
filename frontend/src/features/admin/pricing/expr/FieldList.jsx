import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../../../../components/ui'

const row = 'press flex min-h-11 md:min-h-8 w-full items-center rounded-md px-2.5 py-1.5 text-left text-[15px] md:text-[13px] text-ink hover:bg-sunken focus-visible:bg-sunken outline-none'
const head = 'sticky top-0 z-[1] bg-white px-2.5 pb-1 pt-3 text-[12px] md:text-[11px] font-semibold uppercase tracking-wide text-faint'

// Searchable list of every field, grouped under plain headings.
export default function FieldList({ sections, onPick }) {
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const shown = sections
    .map((s) => ({ ...s, items: t ? s.items.filter((x) => x.label.toLowerCase().includes(t)) : s.items }))
    .filter((s) => s.items.length || (!t && s.empty))
  return (
    <div className="flex flex-col gap-2">
      <Input data-autofocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" aria-label="Search fields"
        prefix={<Search className="h-4 w-4" />} />
      <div className="-mx-1 max-h-[46dvh] overflow-y-auto md:max-h-72">
        {shown.map((s, i) => (
          <div key={`${s.group}-${s.title}`} role="group" aria-label={s.title || s.group}>
            {s.group !== shown[i - 1]?.group && <p className={head}>{s.group}</p>}
            {s.title && <p className="px-2.5 pb-0.5 pt-1.5 text-[13px] md:text-xs font-medium text-muted">{s.title}</p>}
            {s.items.map((x) => <button key={x.key} type="button" className={row} onClick={() => onPick(x.key)}>{x.label}</button>)}
            {!s.items.length && <p className="px-2.5 py-1.5 text-[14px] md:text-[13px] text-muted">{s.empty}</p>}
          </div>
        ))}
        {!shown.length && <p className="px-2.5 py-3 text-[14px] md:text-[13px] text-muted">Nothing matches.</p>}
      </div>
    </div>
  )
}
