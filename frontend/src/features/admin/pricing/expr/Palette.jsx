import { useState } from 'react'
import { Input, SegmentedControl } from '../../../../components/ui'
import { FUNCS } from '../model'

const chip = 'press inline-flex h-9 md:h-7 max-w-full items-center gap-1.5 rounded-md border border-line bg-white px-2 text-[14px] md:text-[13px] text-ink shadow-hair hover:border-line-strong'

// groups: { inputs, settings, lines } as [{ key, label }]. onPick(text, caret).
export default function Palette({ groups, onPick }) {
  const [tab, setTab] = useState('settings')
  const [q, setQ] = useState('')
  const all = tab === 'functions' ? FUNCS : groups[tab]
  const t = q.trim().toLowerCase()
  const list = t ? all.filter((x) => x.label.toLowerCase().includes(t) || x.key.includes(t)) : all
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SegmentedControl size="sm" label="Insert" value={tab} onChange={setTab} className="w-full sm:w-auto"
          options={[{ value: 'settings', label: 'Settings' }, { value: 'lines', label: 'Lines' }, { value: 'inputs', label: 'Board' }, { value: 'functions', label: 'Maths' }]} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" aria-label="Filter names" className="sm:ml-auto sm:w-44" />
      </div>
      <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
        {list.length ? list.map((x) => (
          <button key={x.key} type="button" className={chip} title={x.key}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(x.text ?? x.key, x.caret)}>
            <span className="truncate">{x.label}</span>
            <span className="shrink-0 font-mono text-[12px] md:text-[11px] text-faint">{x.key}</span>
          </button>
        )) : <p className="px-1 py-1.5 text-[14px] md:text-[13px] text-muted">{tab === 'lines' ? 'No earlier lines to use.' : 'Nothing matches.'}</p>}
      </div>
    </div>
  )
}
