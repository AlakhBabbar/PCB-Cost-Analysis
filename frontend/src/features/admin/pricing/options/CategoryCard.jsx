import { Plus } from 'lucide-react'
import { Button, Card, Select, useToast } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import { ids } from '../shared/jump'
import { where } from '../model'
import { parseSpan, spanName } from '../../../../lib/spans'
import OptionRow from './OptionRow'
import { gridCols } from './grid'

const NEUTRAL = { x: 1, pct: 0, add: 0 }
const HEAD = { choice: ['Name', 'Shown as'], number: ['From', 'To'] }
const TAIL = ['Does', 'Amount', 'One time fee']
const round = (n) => Math.round(n * 1000) / 1000

// The next range starts where the highest one ends and is as wide as the last step.
function nextRange(options) {
  const spans = options.map((o) => parseSpan(o.name)).filter(Boolean).sort((a, b) => a[1] - b[1])
  if (!spans.length) return '0-1'
  const [lo, hi] = spans.at(-1)
  const step = hi - lo || hi - (spans.at(-2)?.[1] ?? 0) || 1
  return spanName(hi, round(hi + step))
}

function freshName(options) {
  const names = new Set(options.map((o) => o.name))
  let i = 1
  while (names.has(i === 1 ? 'New option' : `New option ${i}`)) i++
  return i === 1 ? 'New option' : `New option ${i}`
}

export default function CategoryCard({ index }) {
  const { draft, edit, errorAt } = usePricing()
  const toast = useToast()
  const c = draft.categories[index]
  const note = c.key === 'express' || c.options.some((o) => o.note)
  const change = (fn) => edit((d) => fn(d.categories[index]))

  const remove = (i) => {
    const gone = c.options[i]
    change((cat) => cat.options.splice(i, 1))
    toast(`Removed ${gone.label || gone.name}`, { action: { label: 'Undo', onClick: () => change((cat) => cat.options.splice(i, 0, gone)) } })
  }
  const move = (i, by) => change((cat) => cat.options.splice(i + by, 0, ...cat.options.splice(i, 1)))
  const add = () => {
    const op = c.options[0]?.op ?? 'x'
    const name = c.kind === 'number' ? nextRange(c.options) : freshName(c.options)
    change((cat) => cat.options.push({ name, label: '', op, value: NEUTRAL[op], orderFee: 0, note: '', enabled: true }))
  }
  const error = errorAt(where.category(c))

  return (
    <div id={ids.category(c.key)}>
      <Card
        title={c.label}
        description={c.help}
        footer={<Button variant="secondary" size="sm" icon={Plus} onClick={add}>{c.kind === 'number' ? 'Add range' : 'Add option'}</Button>}
      >
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor={`target-${c.key}`} className="text-[14px] md:text-[13px] font-medium text-ink">Changes</label>
          <Select id={`target-${c.key}`} className="sm:w-64"
            options={draft.formulas.map((f) => ({ value: f.key, label: f.label || f.key }))}
            value={c.target} onChange={(e) => change((cat) => { cat.target = e.target.value })} />
          {c.multi && <span className="text-[13px] md:text-xs text-muted">Buyers can pick more than one.</span>}
        </div>
        {c.kind === 'number' && (
          <p className="mt-2 text-[13px] md:text-xs text-muted">
            Each row is a range. Set From and To the same for one exact value. Ranges can touch but not overlap, and a value on the border uses the lower range.
          </p>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-[#b42318]">{error}</p>}
        <div className={`mt-3 hidden gap-x-2 border-b border-line pb-2 text-xs font-medium text-muted md:grid ${gridCols(note, c.kind)}`}>
          {[...HEAD[c.kind ?? 'choice'], ...TAIL, ...(note ? ['Buyer note'] : []), ''].map((h, i) => <span key={i}>{h}</span>)}
        </div>
        <div className="divide-y divide-line">
          {c.options.map((o, i) => (
            <OptionRow key={i} catKey={c.key} catLabel={c.label} kind={c.kind ?? 'choice'} unit={c.unit} option={o} index={i} count={c.options.length} note={note}
              onChange={(patch) => change((cat) => Object.assign(cat.options[i], patch))}
              onMove={(by) => move(i, by)} onRemove={() => remove(i)} />
          ))}
        </div>
        {!c.options.length && <p className="py-4 text-[15px] md:text-sm text-muted">No options yet. Add one so buyers can choose.</p>}
      </Card>
    </div>
  )
}
