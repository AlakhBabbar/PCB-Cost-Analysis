import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { FadeIn } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import ExprView from '../expr/ExprView'
import { ids } from '../shared/jump'
import { plain, where } from '../model'
import LineEditor from './LineEditor'

export default function FormulaLine({ line, index, result }) {
  const { names, errorAt } = usePricing()
  const [open, setOpen] = useState(false)
  const error = errorAt(where.formula(line))
  return (
    <li id={ids.line(line.key)}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#fafaf9] md:px-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] md:text-sm font-medium text-ink">
            {line.label || line.key}
            {line.locked && <Lock className="h-3 w-3 text-faint" aria-label="Needed by the engine" />}
          </p>
          <div className="mt-1 max-h-[3.25rem] overflow-hidden"><ExprView expr={line.expr} names={names} /></div>
          {error && <p role="alert" className="mt-1 text-xs text-[#b42318]">{error}</p>}
        </div>
        <span className="shrink-0 pt-0.5 text-[15px] md:text-sm font-medium tabular-nums text-ink">{result ? plain(result.value) : '-'}</span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <FadeIn y={4}><LineEditor line={line} index={index} result={result} error={error} /></FadeIn>}
    </li>
  )
}
