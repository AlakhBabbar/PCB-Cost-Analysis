import { useState } from 'react'
import { Button, Field, SegmentedControl, Select } from '../../../../components/ui'

const MODES = [{ value: 'picked', label: 'An option is picked' }, { value: 'chosen', label: 'The number chosen' }]

// Buyer's choice: which choice, then which option. Gives a picked or chosen piece.
export default function ChoicePicker({ cats, start, onPick, cta }) {
  const list = Object.values(cats)
  const [mode, setMode] = useState(start?.kind ?? 'picked')
  const pool = mode === 'chosen' ? list.filter((c) => !c.multi) : list
  const [cat, setCat] = useState(start?.cat ?? pool[0]?.key ?? '')
  const c = cats[cat] && pool.includes(cats[cat]) ? cats[cat] : pool[0]
  const [opt, setOpt] = useState(start?.opt ?? '')
  const o = c?.options.find((x) => x.name === opt) ?? c?.options[0]
  const done = () => onPick(mode === 'chosen' ? { kind: 'chosen', cat: c.key } : { kind: 'picked', cat: c.key, opt: o.name })
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl size="sm" label="What to check" options={MODES} value={mode} onChange={setMode} className="w-full" />
      <Field label="Which choice" htmlFor="choice-cat">
        <Select id="choice-cat" value={c?.key ?? ''} onChange={(e) => setCat(e.target.value)}
          options={pool.map((x) => ({ value: x.key, label: x.label }))} />
      </Field>
      {mode === 'picked' && c && (
        <Field label="Which option" htmlFor="choice-opt">
          <Select id="choice-opt" value={o?.name ?? ''} onChange={(e) => setOpt(e.target.value)}
            options={c.options.map((x) => ({ value: x.name, label: x.label || x.name }))} />
        </Field>
      )}
      {mode === 'chosen' && <p className="text-[14px] md:text-[13px] text-muted">The number the buyer typed or picked, for example 1.6 for a 1.6 mm board.</p>}
      <Button className="self-start" disabled={!c || (mode === 'picked' && !o)} onClick={done}>{cta}</Button>
    </div>
  )
}
