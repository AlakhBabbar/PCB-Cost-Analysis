import { FileCheck2 } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Select, Spinner, ToggleGroup } from '../../components/ui'
import { optionLabel } from './defaults'

const SWATCH = { Green: '#1f7a45', Blue: '#1d4ed8', Red: '#b91c1c', Black: '#1e293b', White: '#f8fafc', Yellow: '#eab308', Purple: '#7e22ce' }

export default function QuoteForm({ values, onChange, options, error, onRetry, autoFields = {} }) {
  if (error) return <Card title="Could not load quote options" description={error}><Button variant="secondary" onClick={onRetry}>Try again</Button></Card>
  if (!options || !values) return <div className="grid place-items-center py-24"><Spinner /></div>
  const list = (key, unit) => (options[key] ?? []).map((v) => ({ value: v, label: optionLabel(options, key, v, unit ? `${v} ${unit}` : v) }))
  const field = (key, label, control, isToggle) => (
    <Field
      key={key}
      label={label}
      htmlFor={isToggle ? undefined : `q-${key}`}
      badge={autoFields[key] && <Badge tone="good" icon={FileCheck2}>From Gerber</Badge>}
      className={autoFields[key] ? 'rounded-lg p-2 -m-2 ring-1 ring-accent/25 bg-accent-soft/40' : ''}
    >
      {isToggle ? <div role="group" aria-label={label}>{control}</div> : control}
    </Field>
  )
  const toggle = (key, label) =>
    field(key, label, <ToggleGroup options={list(key)} value={values[key]} onChange={(v) => onChange(key, v)} />, true)
  const select = (key, label, unit) =>
    field(key, label, <Select id={`q-${key}`} options={list(key, unit)} value={values[key]} onChange={(e) => onChange(key, e.target.value)} />)
  const number = (key, label, suffix, inputMode = 'decimal') =>
    field(key, label, (
      <Input id={`q-${key}`} type="number" min="0" step="any" inputMode={inputMode} suffix={suffix} placeholder="0"
        value={values[key]} onChange={(e) => onChange(key, e.target.value)} />
    ))

  const setMask = (color) => {
    onChange('maskColor', color)
    const flip = { White: 'Black', Black: 'White' }[color]
    if (flip && values.silkscreen === color) onChange('silkscreen', flip)
  }

  const section = (title, children) => (
    <Card title={title}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">{children}</div>
    </Card>
  )

  return (
    <div className="flex flex-col gap-4">
      {section('Board', <>
        <div className="sm:col-span-2">{toggle('orderType', 'Order type')}</div>
        {number('boardW', 'Width', 'mm')}
        {number('boardL', 'Length', 'mm')}
        {number('quantity', 'Quantity', 'pcs', 'numeric')}
        {toggle('layers', 'Layers')}
      </>)}
      {section('Build', <>
        {select('thickness', 'Thickness', 'mm')}
        {select('copper', 'Copper weight', 'oz')}
        {select('material', 'Material')}
        {select('finish', 'Surface finish')}
      </>)}
      {section('Appearance', <>
        <div className="sm:col-span-2">
          {field('maskColor', 'Solder mask', (
            <ToggleGroup size="sm" value={values.maskColor} onChange={setMask}
              options={list('maskColor').map((o) => ({ ...o, color: SWATCH[o.value] ?? '#94a3b8' }))} />
          ), true)}
        </div>
        <div className="sm:col-span-2">{toggle('silkscreen', 'Silkscreen')}</div>
      </>)}
      {section('Process', <>
        {toggle('traceSpace', 'Min trace / space (mil)')}
        {toggle('minHole', 'Min hole (mm)')}
        {toggle('ipcStd', 'IPC class')}
        {toggle('testing', 'Electrical test')}
        {toggle('express', 'Production speed')}
      </>)}
      {options.specials?.length > 0 && (
        <Card title="Extras" description="Special requirements add to the board price">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list('specials').map(({ value: k, label }) => (
              <label key={k} className="press flex items-center justify-between gap-3 h-11 px-3 rounded-lg border border-line bg-white text-[15px] md:text-sm text-ink cursor-pointer shadow-hair hover:border-line-strong has-checked:border-ink">
                {label}
                <input type="checkbox" className="w-4 h-4 accent-ink" checked={!!values.specials[k]}
                  onChange={(e) => onChange('specials', { ...values.specials, [k]: e.target.checked })} />
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
