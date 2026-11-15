import { useState } from 'react'
import { Plus, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card } from '../../../../components/ui'
import { Stagger, StaggerItem } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import BoardSize from '../shared/BoardSize'
import useBoardQuote, { quoteProblem } from '../shared/useBoardQuote'
import { capital, runs } from '../model'
import Pipeline from './Pipeline'
import FormulaLine from './FormulaLine'
import AddLineDialog from './AddLineDialog'
import Legend from '../expr/Legend'

export default function FormulasPage() {
  const { token, board, draft, saved } = usePricing()
  const q = useBoardQuote(token, board, draft, saved)
  const [adding, setAdding] = useState(false)
  const lines = Object.fromEntries((q.result?.lines ?? []).map((l) => [l.key, l]))
  const values = q.result ? Object.fromEntries(Object.entries(lines).map(([k, l]) => [k, l.value])) : null
  const problem = quoteProblem(q.error)

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-hair">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <p className="text-[15px] md:text-sm text-muted">
          <span className="font-medium text-ink">Advanced.</span> These lines turn your settings into every price. Each change is checked as you type, and a formula that does not work cannot be saved.
        </p>
      </div>
      <Legend className="px-1" />
      <Card title="Sample board" description="Change the size or quantity to see each stage of the price move.">
        <BoardSize className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:max-w-md" />
        <div className="mt-5"><Pipeline values={values} loading={q.loading} /></div>
        {q.result?.manual && <p className="mt-4 flex items-center gap-2 text-[14px] md:text-[13px] text-muted"><Badge tone="wait">Manual quote</Badge>{q.result.manualReason}</p>}
        {problem && <p className="mt-4 flex items-center gap-2 text-[14px] md:text-[13px] text-muted"><Badge tone={problem.kind === 'blocked' ? 'alert' : 'neutral'}>{problem.kind === 'blocked' ? 'Stopped' : 'No price'}</Badge>{problem.text}</p>}
      </Card>
      <Stagger className="flex flex-col gap-4 md:gap-5">
        {runs(draft.formulas, (f) => f.section).map((g, gi) => (
          <StaggerItem key={`${g.key}-${gi}`} i={gi}>
            <Card title={capital(g.key)} padding={false}>
              <ul className="divide-y divide-line border-t border-line">
                {g.items.map(({ item, i }) => <FormulaLine key={item.key} line={item} index={i} result={lines[item.key]} />)}
              </ul>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
      <Button variant="secondary" icon={Plus} className="self-start" onClick={() => setAdding(true)}>Add a line</Button>
      <AddLineDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
