import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { IconButton, Input, Select, Switch } from '../../../../components/ui'
import NumberInput from '../shared/NumberInput'
import { ids } from '../shared/jump'
import { OPS, reading } from '../model'
import { gridCols } from './grid'

function Cell({ label, className = '', children }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[13px] text-muted md:sr-only">{label}</span>
      {children}
    </label>
  )
}

export default function OptionRow({ catKey, catLabel, option: o, index, count, note, onChange, onMove, onRemove }) {
  const set = (field) => (v) => onChange({ [field]: v })
  const name = o.label || o.name
  return (
    <div id={ids.option(catKey, index)} className={`grid grid-cols-6 items-end gap-x-2 gap-y-2 py-3 md:items-center ${gridCols(note)} ${o.enabled ? '' : 'opacity-60'}`}>
      <Cell label="Name" className="col-span-3 md:col-span-1">
        <Input value={o.name} aria-label={`${catLabel} option name`} onChange={(e) => set('name')(e.target.value)} />
      </Cell>
      <Cell label="Shown as" className="col-span-3 md:col-span-1">
        <Input value={o.label} placeholder={o.name} aria-label={`${name} shown as`} onChange={(e) => set('label')(e.target.value)} />
      </Cell>
      <Cell label="Does" className="col-span-2 md:col-span-1">
        <Select options={OPS} value={o.op} aria-label={`${name} operator`} onChange={(e) => set('op')(e.target.value)} />
      </Cell>
      <Cell label="Amount" className="col-span-2 md:col-span-1">
        <NumberInput value={o.value} aria-label={`${name} amount`} onChange={set('value')} />
      </Cell>
      <Cell label="One time fee" className="col-span-2 md:col-span-1">
        <NumberInput value={o.orderFee} min={0} aria-label={`${name} one time fee`} prefix="₹" onChange={set('orderFee')} />
      </Cell>
      {note && (
        <Cell label="Buyer note" className="col-span-6 md:col-span-1">
          <Input value={o.note} placeholder="For example: 3-5 working days" aria-label={`${name} buyer note`} onChange={(e) => set('note')(e.target.value)} />
        </Cell>
      )}
      <div className="col-span-6 flex items-center justify-between gap-1 md:col-span-1 md:justify-end">
        <p className="min-w-0 text-[13px] tabular-nums text-muted md:hidden">{reading(o)}</p>
        <div className="flex items-center gap-0.5">
          <Switch checked={o.enabled} onChange={set('enabled')} label={`Offer ${name}`} className="mr-1.5" />
          <IconButton icon={ArrowUp} label={`Move ${name} up`} size="sm" disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton icon={ArrowDown} label={`Move ${name} down`} size="sm" disabled={index === count - 1} onClick={() => onMove(1)} />
          <IconButton icon={Trash2} label={`Remove ${name}`} size="sm" onClick={onRemove} />
        </div>
      </div>
      <p className="col-span-full -mt-1 hidden text-xs tabular-nums text-muted md:block">{reading(o)}</p>
    </div>
  )
}
