import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { Spinner, Switch } from '../../../../components/ui'
import { tryFormula } from '../../../../api/pricingAdmin'
import { usePricing } from '../PricingContext'
import useBoardQuote from '../shared/useBoardQuote'
import { plain } from '../model'
import { parse } from './tokens'
import { layout } from './edit'
import { funcName, opChip, pieceLabel, plainMessage } from './words'
import { realValues, short } from './sample'

const box = 'h-8 md:h-7 w-full min-w-0 rounded-md border border-line bg-white px-2 text-[16px] md:text-[13px] tabular-nums text-ink outline-none hover:border-line-strong focus:border-ink/40 focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-red-400'
const isNum = (t) => /^-?(\d+(\.\d*)?|\.\d+)$/.test(String(t).trim())

// One box or switch per distinct field, picked option and chosen number in the formula.
function slotsOf(ps, book, cfg) {
  const units = Object.fromEntries(cfg.settings.map((s) => [s.key, s.unit]))
  const seen = new Map()
  for (const p of ps) {
    const id = p.kind === 'field' ? `f:${p.key}` : p.kind === 'picked' ? `p:${p.cat}:${p.opt}` : p.kind === 'chosen' ? `c:${p.cat}` : null
    if (!id || seen.has(id)) continue
    const unit = p.kind === 'field' && units[p.key]
    seen.set(id, { id, p, label: pieceLabel(p, book) + (unit ? ` (${unit})` : '') })
  }
  return [...seen.values()]
}

function writeOut(ps, words, numOf) {
  return ps.map((p, i) => {
    if (p.kind === 'op') return opChip(p.text)
    if (p.kind === 'comma') return words[i] ?? ','
    if (p.kind === 'func') return `${funcName(p.name)} (`
    if (p.kind === 'open') return '('
    if (p.kind === 'close') return ')'
    if (p.kind === 'prefix') return p.text === 'not' ? 'not' : p.text
    if (p.kind === 'num') return p.text
    return numOf(p)
  }).join(' ')
}

export default function Playground({ expr, book, rule, after }) {
  const { token, board, draft, saved } = usePricing()
  const q = useBoardQuote(token, board, draft, saved)
  const ps = useMemo(() => parse(expr), [expr])
  const { words } = useMemo(() => layout(ps), [ps])
  const slots = useMemo(() => slotsOf(ps, book, draft), [ps, book, draft])
  const real = useMemo(() => realValues(draft, board, q.result), [draft, board, q.result])
  const [typed, setTyped] = useState({})
  const [answer, setAnswer] = useState(null)
  const seq = useRef(0)

  const realOf = (s) => (s.p.kind === 'field' ? real.fields[s.p.key] ?? 0 : s.p.kind === 'picked' ? real.picked(s.p.cat, s.p.opt) : real.chosen(s.p.cat))
  const valueOf = (s) => (s.id in typed ? typed[s.id] : realOf(s))
  const ok = slots.every((s) => s.p.kind === 'picked' || isNum(valueOf(s)))
  const body = { expr, values: {}, picked: [], chosen: {} }
  for (const s of slots) {
    const v = valueOf(s)
    if (s.p.kind === 'field') body.values[s.p.key] = Number(v)
    else if (s.p.kind === 'chosen') body.chosen[s.p.cat] = Number(v)
    else if (v) body.picked.push([s.p.cat, s.p.opt])
  }
  const sig = JSON.stringify(body)

  useEffect(() => {
    if (!ok) return
    const id = ++seq.current
    const t = setTimeout(() => {
      tryFormula(token, JSON.parse(sig)).then(
        (r) => id === seq.current && setAnswer(r),
        (e) => id === seq.current && setAnswer({ ok: false, error: e.message || 'Could not work this out.' }),
      )
    }, 350)
    return () => clearTimeout(t)
  }, [sig, ok, token])

  const numOf = (p) => {
    if (p.kind === 'field') return short(body.values[p.key])
    if (p.kind === 'chosen') return short(body.chosen[p.cat])
    if (p.kind === 'picked') return body.picked.some(([c, o]) => c === p.cat && o === p.opt) ? 'yes' : 'no'
    return '?'
  }
  const result = !ok ? { ok: false, error: 'Type a number in every box.' } : answer

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-3">
      {slots.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((s) => (
            <label key={s.id} className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[12px] md:text-[11px] font-medium text-muted" title={s.label}>{s.label}</span>
              {s.p.kind === 'picked' ? (
                <span className="flex h-8 md:h-7 items-center gap-2 text-[13px] text-ink">
                  <Switch checked={!!valueOf(s)} label={s.label} onChange={(v) => setTyped((t) => ({ ...t, [s.id]: v }))} />
                  {valueOf(s) ? 'Yes' : 'No'}
                </span>
              ) : (
                <input type="text" inputMode="decimal" className={box} value={s.id in typed ? typed[s.id] : short(realOf(s))}
                  aria-invalid={!isNum(valueOf(s))} onChange={(e) => setTyped((t) => ({ ...t, [s.id]: e.target.value }))} />
              )}
            </label>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {!result ? <p className="flex items-center gap-2 text-[13px] text-muted"><Spinner size={12} />Working it out</p>
          : result.ok ? (
            <p className="text-[17px] md:text-base font-semibold text-ink">
              {rule ? (result.value ? 'Yes, this rule would apply' : 'No, this rule would not apply') : `Answer: ${plain(result.value)}`}
            </p>
          ) : (
            <p role="alert" className="flex items-start gap-1.5 text-[13px] text-[#b42318]"><CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />{plainMessage(result.error, book)}</p>
          )}
        <p className="break-words text-[13px] md:text-xs tabular-nums text-muted">{writeOut(ps, words, numOf)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] md:text-[11px] text-faint">
        {after?.length > 0 && <span>Buyer options ({after.join(', ')}) are applied after this.</span>}
        <span>These numbers are only for testing. Nothing here is saved.</span>
        <button type="button" disabled={!Object.keys(typed).length} onClick={() => setTyped({})}
          className="font-medium text-accent hover:underline disabled:text-faint disabled:no-underline">Reset numbers</button>
      </div>
    </div>
  )
}
