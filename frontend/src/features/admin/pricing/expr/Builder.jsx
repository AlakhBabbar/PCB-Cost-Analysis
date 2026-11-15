import { useMemo, useState } from 'react'
import { ChevronDown, FlaskConical, Plus } from 'lucide-react'
import { FadeIn } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import { parse, serialize } from './tokens'
import { addArg, balance, insertAt, joinAt, layout, put, removeAt, replaceAt, unit } from './edit'
import { makeBook, pieceLabel, plainMessage } from './words'
import Piece from './Piece'
import { chip } from './styles'
import PieceMenu from './PieceMenu'
import PieceActions from './PieceActions'
import AddDialog from './AddDialog'
import Status from './Status'
import Playground from './Playground'

// The pick-only formula builder. upto: lines above that may be used. joiner: operator offered first. lead: pieces before the formula. rule, after: for the test panel.
export default function Builder({ value, onChange, upto, error, pending, label, joiner = '+', lead, rule, after }) {
  const { draft } = usePricing()
  const book = useMemo(() => makeBook(draft, upto), [draft, upto])
  const ps = useMemo(() => parse(value), [value])
  const { words, funcClose } = useMemo(() => layout(ps), [ps])
  const [menu, setMenu] = useState(null)
  const [add, setAdd] = useState(null)
  const [testing, setTesting] = useState(false)
  const commit = (next) => onChange(serialize(next))
  const p = menu && ps[menu.i]

  const act = (name, arg) => {
    const { i } = menu
    const [s, e] = unit(ps, i)
    if (name !== 'number') setMenu(null)
    if (name === 'number') commit(replaceAt(ps, i, [{ kind: 'num', text: arg }]))
    else if (name === 'change') setAdd({ replace: i, start: p })
    else if (name === 'before') setAdd({ pos: s })
    else if (name === 'after') setAdd({ pos: e + 1 })
    else if (name === 'open') commit(put(ps, s, { kind: 'open' }))
    else if (name === 'close') commit(put(ps, e + 1, { kind: 'close' }))
    else if (name === 'swap') commit(ps.with(i, { ...p, name: arg }))
    else if (name === 'arg') commit(addArg(ps, i))
    else if (name === 'remove') commit(removeAt(ps, i))
  }
  const placed = (pieces, op) => {
    commit(add.replace != null ? replaceAt(ps, add.replace, pieces) : insertAt(ps, add.pos, pieces, op))
    setAdd(null)
  }
  const open = (i, el) => setMenu((m) => (m?.i === i ? null : { i, el }))
  const bad = error ? plainMessage(error, book) : null

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div role="group" aria-label={label} className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1.5">
        {lead}
        {ps.map((x, i) => (
          <Piece key={i} p={x} book={book} label={pieceLabel(x, book)} comma={words[i]} funcClose={funcClose.has(i)}
            active={menu?.i === i} onOpen={(el) => open(i, el)} onOp={(t) => commit(ps.with(i, { ...x, text: t }))} />
        ))}
        <button type="button" onClick={() => setAdd({ pos: ps.length })}
          className={`${chip} gap-1 border border-dashed border-line-strong px-2 text-muted hover:border-ink/40 hover:text-ink`}>
          <Plus className="h-3.5 w-3.5" />Add
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Status error={bad} pending={pending} brackets={balance(ps)} />
        <button type="button" aria-expanded={testing} onClick={() => setTesting((t) => !t)}
          className="press -my-1 inline-flex h-8 md:h-6 items-center gap-1 rounded-md px-1.5 text-[13px] md:text-xs font-medium text-accent hover:bg-sunken">
          <FlaskConical className="h-3.5 w-3.5" />Test it<ChevronDown className={`h-3.5 w-3.5 transition-transform ${testing ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {testing && <FadeIn y={4}><Playground expr={value} book={book} rule={rule} after={after} /></FadeIn>}
      <PieceMenu open={!!p} anchor={menu?.el} title={p ? pieceLabel(p, book) : ''} onClose={() => setMenu(null)}>
        {p && <PieceActions key={menu.i} p={p} act={act} />}
      </PieceMenu>
      <AddDialog open={!!add} onClose={() => setAdd(null)} book={book} replace={add?.replace != null}
        need={add && add.replace == null ? joinAt(ps, add.pos) : null} joiner={joiner} start={add?.start} onPick={placed} />
    </div>
  )
}
