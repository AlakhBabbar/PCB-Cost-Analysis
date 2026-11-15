import { Card, Field, Select, Switch } from '../../../../components/ui'
import { parseSpan, showSpans } from '../../../../lib/spans'
import NumberInput from '../shared/NumberInput'
import { usePricing } from '../PricingContext'
import BoardSize from '../shared/BoardSize'
import { fitBoard } from '../model'

export default function BoardForm({ config }) {
  const { board, setBoard } = usePricing()
  const fit = fitBoard(board, config)
  const set = (k, v) => setBoard((b) => ({ ...b, [k]: v }))
  const types = config.orderTypes.filter((t) => t.enabled)
  return (
    <Card title="Board">
      <div className="flex flex-col gap-4">
        <Field label="Order type" htmlFor="t-orderType">
          <Select id="t-orderType" value={fit.orderType} options={types.map((t) => t.name)} onChange={(e) => set('orderType', e.target.value)} />
        </Field>
        <BoardSize />
        {config.categories.map((c) => {
          const on = c.options.filter((o) => o.enabled)
          if (c.multi) {
            return (
              <fieldset key={c.key} className="flex flex-col gap-2.5">
                <legend className="mb-2 text-[14px] md:text-[13px] font-medium text-ink">{c.label}</legend>
                {on.map((o) => (
                  <span key={o.name} className="flex items-center justify-between gap-3 text-[15px] md:text-sm text-ink">
                    {o.label || o.name}
                    <Switch checked={!!fit.specials[o.name]} label={o.label || o.name}
                      onChange={(v) => setBoard((b) => ({ ...b, specials: { ...b.specials, [o.name]: v } }))} />
                  </span>
                ))}
              </fieldset>
            )
          }
          const spans = c.kind === 'number' ? on.map((o) => parseSpan(o.name)).filter(Boolean) : []
          if (spans.some(([lo, hi]) => lo !== hi)) {
            return (
              <Field key={c.key} label={c.label} htmlFor={`t-${c.key}`} help={`We make ${showSpans(spans, c.unit)}`}>
                <NumberInput id={`t-${c.key}`} value={Number(fit[c.key])} min={0} suffix={c.unit} onChange={(v) => set(c.key, String(v))} />
              </Field>
            )
          }
          return (
            <Field key={c.key} label={c.label} htmlFor={`t-${c.key}`}>
              <Select id={`t-${c.key}`} value={fit[c.key]} options={on.map((o) => ({ value: o.name, label: o.label || o.name }))}
                onChange={(e) => set(c.key, e.target.value)} />
            </Field>
          )
        })}
      </div>
    </Card>
  )
}
