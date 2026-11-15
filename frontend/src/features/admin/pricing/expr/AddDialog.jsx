import { useState } from 'react'
import { Button, Dialog, Field, Input, ToggleGroup } from '../../../../components/ui'
import { parse } from './tokens'
import { FUNC_HELP, FUNC_START, funcName } from './words'
import OpSelect from './OpSelect'
import FieldList from './FieldList'
import ChoicePicker from './ChoicePicker'

const KINDS = [
  { value: 'field', label: 'A field' },
  { value: 'num', label: 'A number' },
  { value: 'choice', label: "Buyer's choice" },
  { value: 'func', label: 'Rounding and if' },
]
const row = 'press flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-sunken focus-visible:bg-sunken outline-none'
const tabOf = (p) => (!p ? 'field' : p.kind === 'picked' || p.kind === 'chosen' ? 'choice' : p.kind === 'raw' ? 'field' : p.kind)

function NumberForm({ onPick, cta }) {
  const [text, setText] = useState('')
  const ok = /^-?(\d+(\.\d*)?|\.\d+)$/.test(text.trim())
  return (
    <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (ok) onPick({ kind: 'num', text: text.trim() }) }}>
      <Field label="Number" htmlFor="add-num" className="flex-1">
        <Input id="add-num" data-autofocus type="text" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="For example 2" />
      </Field>
      <Button type="submit" disabled={!ok}>{cta}</Button>
    </form>
  )
}

// need: 'before' | 'after' | null, where the new piece needs an operator to join it.
function Body({ book, need, joiner, start, replace, onPick }) {
  const [op, setOp] = useState(joiner)
  const [tab, setTab] = useState(tabOf(start))
  const cta = replace ? 'Use this' : 'Add'
  const pick = (pieces) => onPick(Array.isArray(pieces) ? pieces : [pieces], op)
  return (
    <div className="flex flex-col gap-4 pb-2">
      {need && (
        <Field label={need === 'before' ? 'Joined to what comes before by' : 'Joined to what comes after by'} htmlFor="add-op">
          <OpSelect full id="add-op" value={op} onChange={setOp} />
        </Field>
      )}
      <ToggleGroup size="sm" options={KINDS} value={tab} onChange={setTab} />
      {tab === 'field' && <FieldList sections={book.sections} onPick={(key) => pick({ kind: 'field', key })} />}
      {tab === 'num' && <NumberForm cta={cta} onPick={pick} />}
      {tab === 'choice' && <ChoicePicker cats={book.cats} start={start} cta={cta} onPick={pick} />}
      {tab === 'func' && (
        <div className="-mx-1 flex flex-col">
          {Object.keys(FUNC_START).map((n) => (
            <button key={n} type="button" className={row} onClick={() => pick(parse(FUNC_START[n]))}>
              <span className="text-[15px] md:text-[13px] font-medium text-ink">{n === 'if' ? 'If, then, otherwise' : funcName(n)}</span>
              <span className="text-[13px] md:text-xs text-muted">{FUNC_HELP[n]}</span>
            </button>
          ))}
          <p className="px-2.5 pt-2 text-[13px] md:text-xs text-muted">It starts with 0 and 1 in its places. Tap them to change.</p>
        </div>
      )}
    </div>
  )
}

export default function AddDialog({ open, onClose, replace, ...rest }) {
  return (
    <Dialog open={open} onClose={onClose} size="sm" title={replace ? 'Change this piece' : 'Add to the formula'}>
      <Body replace={replace} {...rest} />
    </Dialog>
  )
}
