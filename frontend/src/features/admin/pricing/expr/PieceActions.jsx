import { useState } from 'react'
import { ChevronsLeft, ChevronsRight, Parentheses, Plus, Repeat, Trash2 } from 'lucide-react'
import { Input } from '../../../../components/ui'
import { FUNC_SWAP, funcName } from './words'
import { MenuItem } from './PieceMenu'

const isNumber = (t) => /^-?(\d+(\.\d*)?|\.\d+)$/.test(t.trim())

function NumberBox({ value, onChange, onDone }) {
  const [text, setText] = useState(value)
  const set = (t) => {
    setText(t)
    if (isNumber(t)) onChange(t.trim())
  }
  return (
    <div className="px-1 pb-1.5 pt-0.5">
      <Input type="text" inputMode="decimal" aria-label="Number" value={text} aria-invalid={!isNumber(text)}
        className="md:h-8!" onChange={(e) => set(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onDone()} />
    </div>
  )
}

// What can be done to one piece. act(name, arg) runs it.
export default function PieceActions({ p, act }) {
  if (p.kind === 'prefix') return <MenuItem icon={Trash2} tone="danger" onClick={() => act('remove')}>Remove</MenuItem>
  if (p.kind === 'open' || p.kind === 'close') {
    return (
      <>
        <MenuItem icon={p.kind === 'open' ? ChevronsLeft : ChevronsRight} onClick={() => act(p.kind === 'open' ? 'before' : 'after')}>
          {p.kind === 'open' ? 'Add before' : 'Add after'}
        </MenuItem>
        <MenuItem icon={Trash2} tone="danger" onClick={() => act('remove')}>Remove both brackets</MenuItem>
      </>
    )
  }
  return (
    <>
      {p.kind === 'num' && <NumberBox value={p.text} onChange={(t) => act('number', t)} onDone={() => act('done')} />}
      {p.kind !== 'num' && p.kind !== 'func' && <MenuItem icon={Repeat} onClick={() => act('change')}>Change</MenuItem>}
      {p.kind === 'func' && (FUNC_SWAP[p.name] ?? []).map((n) => (
        <MenuItem key={n} icon={Repeat} onClick={() => act('swap', n)}>Change to {funcName(n)}</MenuItem>
      ))}
      {p.kind === 'func' && ['max', 'min'].includes(p.name) && <MenuItem icon={Plus} onClick={() => act('arg')}>Add one more value</MenuItem>}
      <MenuItem icon={ChevronsLeft} onClick={() => act('before')}>Add before</MenuItem>
      <MenuItem icon={ChevronsRight} onClick={() => act('after')}>Add after</MenuItem>
      <MenuItem icon={Parentheses} onClick={() => act('open')}>Open bracket before</MenuItem>
      <MenuItem icon={Parentheses} onClick={() => act('close')}>Close bracket after</MenuItem>
      <MenuItem icon={Trash2} tone="danger" onClick={() => act('remove')}>Remove</MenuItem>
    </>
  )
}
