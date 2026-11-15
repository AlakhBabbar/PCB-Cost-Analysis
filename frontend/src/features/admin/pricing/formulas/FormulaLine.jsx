import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { FadeIn } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import Builder from '../expr/Builder'
import { ids } from '../shared/jump'
import { plain, where } from '../model'
import LineDetails from './LineDetails'

export default function FormulaLine({ line, index, result }) {
  const { draft, edit, errorAt, check } = usePricing()
  const [open, setOpen] = useState(false)
  const name = line.label || 'Unnamed line'
  const by = draft.categories.filter((c) => c.target === line.key).map((c) => c.label)
  return (
    <li id={ids.line(line.key)} className="flex flex-col gap-2 px-4 py-3 md:px-5">
      <div className="flex items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px] md:text-sm font-medium text-ink">
          <span className="truncate">{name}</span>
          {line.locked && <Lock className="h-3 w-3 shrink-0 text-faint" aria-label="Needed by the engine" />}
        </p>
        <span className="shrink-0 text-[15px] md:text-sm font-medium tabular-nums text-ink">{result ? plain(result.value) : '-'}</span>
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
          className="press -mr-1.5 inline-flex h-8 md:h-7 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-[13px] md:text-xs font-medium text-muted hover:bg-sunken hover:text-ink">
          Details<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <Builder value={line.expr} onChange={(v) => edit((d) => { d.formulas[index].expr = v })} upto={index}
        label={`Formula for ${name}`} error={errorAt(where.formula(line))} pending={check.pending} after={by} />
      {open && <FadeIn y={4}><LineDetails line={line} index={index} result={result} by={by} /></FadeIn>}
    </li>
  )
}
