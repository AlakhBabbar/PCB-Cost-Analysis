import { Card } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import { capital, opText, plain, plusMinus, runs } from '../model'

export default function Breakdown({ lines, config }) {
  const { names } = usePricing()
  const cats = Object.fromEntries(config.categories.map((c) => [c.key, c]))
  const optLabel = (a) => cats[a.category]?.options.find((o) => o.name === a.option)?.label || a.option
  return (
    <Card title="Every line" description="Each step of the price for this board, in the order it is worked out." padding={false}>
      <div className="border-t border-line">
        {runs(lines, (l) => l.section).map((g, gi) => (
          <section key={`${g.key}-${gi}`} className="border-b border-line last:border-b-0">
            <h3 className="bg-canvas px-4 py-1.5 text-[13px] md:text-xs font-medium text-muted md:px-5">{capital(g.key)}</h3>
            <ul className="divide-y divide-line">
              {g.items.map(({ item: l }) => (
                <li key={l.key} className="px-4 py-2.5 md:px-5">
                  <div className="flex items-baseline justify-between gap-3 text-[15px] md:text-sm">
                    <span className="min-w-0 text-ink">{l.label || names[l.key]?.label || l.key}</span>
                    <span className="shrink-0 tabular-nums font-medium text-ink">{plain(l.value)}</span>
                  </div>
                  {l.adjustments.map((a, i) => (
                    <div key={i} className="mt-0.5 flex justify-between gap-3 text-[13px] md:text-xs text-muted">
                      <span className="min-w-0">{cats[a.category]?.label ?? a.category}: {optLabel(a)}, {opText(a.op, a.value)}</span>
                      <span className="shrink-0 tabular-nums">{plusMinus(a.delta)}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  )
}
