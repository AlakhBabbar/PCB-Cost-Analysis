import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Button, Field, Input, useToast } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import ExprEditor from '../expr/ExprEditor'
import { paletteGroups } from '../model'
import Adjustments from './Adjustments'

export default function LineEditor({ line, index, result, error }) {
  const { draft, edit, names, check } = usePricing()
  const toast = useToast()
  const set = (patch) => edit((d) => Object.assign(d.formulas[index], patch))
  const move = (by) => edit((d) => d.formulas.splice(index + by, 0, ...d.formulas.splice(index, 1)))
  const remove = () => {
    edit((d) => d.formulas.splice(index, 1))
    toast(`Removed ${line.label || line.key}`, { action: { label: 'Undo', onClick: () => edit((d) => d.formulas.splice(index, 0, line)) } })
  }
  const by = draft.categories.filter((c) => c.target === line.key).map((c) => c.label)
  const last = draft.formulas.length - 1

  return (
    <div className="flex flex-col gap-4 bg-canvas/60 px-4 pb-5 pt-1 md:px-5">
      {line.help && <p className="text-[14px] md:text-[13px] text-muted">{line.help}</p>}
      {line.locked ? (
        <p className="text-[13px] md:text-xs text-muted">The price needs this line, so its formula can change but it cannot be renamed or removed.</p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Name" htmlFor={`line-name-${line.key}`} className="sm:flex-1">
            <Input id={`line-name-${line.key}`} value={line.label} onChange={(e) => set({ label: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={ArrowUp} disabled={index === 0} onClick={() => move(-1)}>Up</Button>
            <Button variant="secondary" size="sm" icon={ArrowDown} disabled={index === last} onClick={() => move(1)}>Down</Button>
            <Button variant="secondary" size="sm" icon={Trash2} onClick={remove}>Remove</Button>
          </div>
        </div>
      )}
      <ExprEditor id={`expr-${line.key}`} label={`Formula, written with names (${line.key})`} value={line.expr} onChange={(v) => set({ expr: v })}
        names={names} groups={paletteGroups(draft, index)} error={error} pending={check.pending} />
      {by.length > 0 && <p className="text-[14px] md:text-[13px] text-muted">Then adjusted by {by.join(', ')}.</p>}
      {result && (
        <div className="rounded-lg border border-line bg-white p-3">
          <p className="mb-2 text-[13px] md:text-xs font-medium text-muted">For the sample board</p>
          <Adjustments result={result} />
        </div>
      )}
    </div>
  )
}
