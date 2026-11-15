import { Card, Timeline } from '../../../components/ui'
import { dateTime } from '../../../lib/format'
import { paymentOf, stageOf } from './labels'

function describe(row) {
  const d = row.detail ?? {}
  switch (row.action) {
    case 'order_created': return { title: 'Order placed', tone: 'accent' }
    case 'order_stage': return { title: `Moved to ${stageOf(d.to).label}`, tone: d.to === 'cancelled' ? 'neutral' : 'info' }
    case 'order_note': return { title: 'Note saved', extra: d.note }
    case 'woo_webhook': return { title: `Payment: ${paymentOf(d.to).label}`, tone: paymentOf(d.to).tone, who: 'The shop' }
    case 'woo_sync': return { title: `Payment checked: ${paymentOf(d.to).label}`, tone: paymentOf(d.to).tone }
    default: return { title: row.action.replace(/_/g, ' ') }
  }
}

export default function OrderTimeline({ rows }) {
  const items = rows.map((row) => {
    const { title, tone, extra, who } = describe(row)
    return {
      id: row.id,
      title,
      tone,
      time: row.createdAt,
      detail: (
        <>
          {extra && <span className="mb-0.5 block whitespace-pre-wrap text-ink">{extra}</span>}
          {who ?? row.adminName ?? 'System'}, {dateTime(row.createdAt)}
        </>
      ),
    }
  })
  return (
    <Card title="Timeline">
      {items.length ? <Timeline items={items} /> : <p className="text-[15px] md:text-sm text-muted">Nothing has happened to this order yet.</p>}
    </Card>
  )
}
