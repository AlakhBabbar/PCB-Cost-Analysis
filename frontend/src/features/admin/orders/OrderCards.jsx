import { EyeOff } from 'lucide-react'
import { Card, KeyValue, Money } from '../../../components/ui'
import { pct } from '../../../lib/format'

export function BoardCard({ summary }) {
  const items = Object.entries(summary ?? {}).map(([label, value]) => ({ label, value: String(value) }))
  return (
    <Card title="Board" description="Everything the buyer chose.">
      {items.length ? <KeyValue items={items} /> : <p className="text-[15px] md:text-sm text-muted">No board details were saved with this order.</p>}
    </Card>
  )
}

export function MoneyCard({ money, margin }) {
  return (
    <Card title="Money">
      <KeyValue items={[
        { label: 'Price per board', value: <Money value={money.pricePerBoard} /> },
        { label: 'Quantity', value: money.quantity?.toLocaleString('en-IN') },
        { label: 'Engineering fee', value: <Money value={money.engFee} /> },
        { label: 'Subtotal', value: <Money value={money.subtotal} /> },
        { label: 'GST', value: <Money value={money.gst} /> },
        { label: 'Total', value: <Money value={money.total} className="font-semibold" /> },
      ]} />
      <div className="mt-4 rounded-lg bg-sunken px-3.5 py-3">
        <p className="mb-2 inline-flex items-center gap-1.5 text-[13px] md:text-xs font-medium text-muted">
          <EyeOff className="h-3.5 w-3.5" />Only you see this
        </p>
        {margin ? (
          <KeyValue items={[
            { label: 'Your cost per board', value: <Money value={margin.costPerBoard} /> },
            { label: 'Profit per board', value: <Money value={margin.perBoard} /> },
            { label: 'Profit on this order', value: <Money value={margin.total} className="font-semibold" /> },
            { label: 'Margin', value: pct(margin.marginPct) },
          ]} />
        ) : (
          <p className="text-[14px] md:text-[13px] text-muted">Your cost was not saved for this order, so the margin is unknown.</p>
        )}
      </div>
    </Card>
  )
}
