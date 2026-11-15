import { Badge, Card, Skeleton, Stat } from '../../../../components/ui'
import { inr, pct } from '../../../../lib/format'
import { quoteProblem } from '../shared/useBoardQuote'

export default function ResultCard({ quote, minMargin }) {
  const { result: r, error, loading } = quote
  const problem = quoteProblem(error)
  if (loading && !r && !problem) {
    return <Card title="Price"><div className="grid grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div></Card>
  }
  if (problem) {
    return (
      <Card title="Price">
        <p className="flex flex-wrap items-center gap-2 text-[15px] md:text-sm text-ink">
          <Badge tone={problem.kind === 'blocked' ? 'alert' : 'neutral'}>{problem.kind === 'blocked' ? 'Order stopped' : 'No price'}</Badge>{problem.text}
        </p>
      </Card>
    )
  }
  if (r.manual) {
    return (
      <Card title="Price">
        <p className="flex flex-wrap items-center gap-2 text-[15px] md:text-sm text-ink"><Badge tone="wait">Manual quote</Badge>{r.manualReason}</p>
        <p className="mt-2 text-[13px] md:text-xs text-muted">The buyer sees this sentence instead of a price. The lines below show what the price would have been.</p>
      </Card>
    )
  }
  const good = r.profit.marginPct >= minMargin
  return (
    <Card title="Price" actions={<Badge tone={good ? 'good' : 'alert'}>{good ? 'Margin is good' : 'Margin is low'}</Badge>}>
      <div className={`grid grid-cols-2 gap-x-4 gap-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <Stat label="Price per board" value={r.pricePerBoard} format={inr} />
        <Stat label="Total with tax" value={r.total} format={inr} detail={`${r.quantity} boards`} />
        <Stat label="Your cost per board" value={r.costPerBoard} format={inr} />
        <Stat label="Margin" value={r.profit.marginPct} format={(v) => pct(v)} detail={`Lowest allowed ${pct(minMargin, 0)}, profit ${inr(r.profit.total)}`} />
      </div>
    </Card>
  )
}
