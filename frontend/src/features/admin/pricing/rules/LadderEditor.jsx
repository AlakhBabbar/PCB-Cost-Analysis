import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import NumberInput from '../shared/NumberInput'
import { where } from '../model'

export default function LadderEditor() {
  const { draft, edit, errorAt } = usePricing()
  const tiers = draft.markupTiers
  const sort = () => edit((d) => d.markupTiers.sort((a, b) => a.maxQty - b.maxQty))
  const add = () => edit((d) => {
    const last = d.markupTiers.at(-1)
    d.markupTiers.push({ maxQty: (last?.maxQty ?? 0) * 2 || 10, markupPct: last?.markupPct ?? 30 })
  })
  const counts = tiers.reduce((m, t) => m.set(t.maxQty, (m.get(t.maxQty) ?? 0) + 1), new Map())
  const error = errorAt(where.ladder)

  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-[15px] md:text-sm font-semibold text-ink">Quantity ladder</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">The first step whose quantity is at or above the order is used. 10 pcs at 90% means orders of 6 to 10 boards get 90% markup.</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-2 gap-y-2 text-xs font-medium text-muted">
        <span>Up to quantity</span><span>Markup</span><span className="w-10 md:w-8" />
        {tiers.map((t, i) => {
          const dupe = counts.get(t.maxQty) > 1
          return [
            <NumberInput key={`q${i}`} value={t.maxQty} min={1} step={1} inputMode="numeric" suffix="pcs" aria-label="Up to quantity"
              aria-invalid={dupe} onBlur={sort} onChange={(v) => edit((d) => { d.markupTiers[i].maxQty = Math.max(1, Math.round(v)) })} />,
            <NumberInput key={`m${i}`} value={t.markupPct} suffix="%" aria-label="Markup" onChange={(v) => edit((d) => { d.markupTiers[i].markupPct = v })} />,
            <IconButton key={`r${i}`} icon={Trash2} label="Remove step" size="sm" className="self-center" onClick={() => edit((d) => d.markupTiers.splice(i, 1))} />,
          ]
        })}
      </div>
      {(counts.size < tiers.length || error) && <p role="alert" className="mt-2 text-xs text-[#b42318]">{error ?? 'Each quantity can appear only once.'}</p>}
      <Button variant="secondary" size="sm" icon={Plus} className="mt-3" onClick={add}>Add step</Button>
    </div>
  )
}
