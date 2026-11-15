import { usePricing } from '../PricingContext'
import { opText, plain, plusMinus } from '../model'

// Worked example of one line: what the formula gave, each buyer option applied, and the result.
export default function Adjustments({ result }) {
  const { draft } = usePricing()
  const cats = Object.fromEntries(draft.categories.map((c) => [c.key, c]))
  const adj = result.adjustments ?? []
  const before = result.value - adj.reduce((s, a) => s + a.delta, 0)
  const optLabel = (a) => cats[a.category]?.options.find((o) => o.name === a.option)?.label || a.option
  return (
    <dl className="flex flex-col gap-1.5 text-[14px] md:text-[13px]">
      {adj.length > 0 && (
        <div className="flex justify-between gap-3"><dt className="text-muted">The formula gives</dt><dd className="tabular-nums text-ink">{plain(before)}</dd></div>
      )}
      {adj.map((a, i) => (
        <div key={i} className="flex justify-between gap-3">
          <dt className="min-w-0 text-muted">{cats[a.category]?.label ?? a.category}: {optLabel(a)}, {opText(a.op, a.value)}</dt>
          <dd className="shrink-0 tabular-nums text-ink">{plusMinus(a.delta)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-medium">
        <dt className="text-ink">{result.label}</dt><dd className="tabular-nums text-ink">{plain(result.value)}</dd>
      </div>
    </dl>
  )
}
