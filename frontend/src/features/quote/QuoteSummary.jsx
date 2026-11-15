import { AlertCircle, PencilLine, Ruler, Truck } from 'lucide-react'
import { Spinner, Stat } from '../../components/ui'
import { CountUp, FadeIn } from '../../components/motion'
import { inr } from '../../lib/format'
import ManualRequest from './ManualRequest'

const Row = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-4 ${strong ? 'text-base font-semibold text-ink' : 'text-[15px] md:text-sm text-muted'}`}>
    <span>{label}</span>
    <CountUp value={value} format={inr} />
  </div>
)

function Problem({ error }) {
  const Icon = error.blocked ? PencilLine : AlertCircle
  return (
    <FadeIn className="flex gap-3 rounded-lg bg-canvas p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        {error.blocked && <p className="text-[15px] md:text-sm font-semibold text-ink">Change this to get a price</p>}
        <p className="text-[14px] md:text-[13px] text-muted">{error.message}</p>
      </div>
    </FadeIn>
  )
}

export default function QuoteSummary({ quote, loading, error, action, manual }) {
  if (error) return <Problem error={error} />
  if (!quote) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-[15px] md:text-sm text-muted">
        {loading ? <Spinner /> : <Ruler className="w-5 h-5 text-faint" />}
        Enter board size and quantity
      </div>
    )
  }
  if (quote.manual) {
    return <FadeIn key="manual"><ManualRequest reason={quote.manualReason} {...manual} /></FadeIn>
  }
  return (
    <FadeIn key="price" className={`flex flex-col gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <Stat hero label="Price per board" value={quote.pricePerBoard} format={inr} detail={`${quote.quantity} boards`} />
      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <Row label="Subtotal" value={quote.subtotal} />
        {quote.engFee > 0 && <Row label="Engineering fee" value={quote.engFee} />}
        <Row label={`GST (${quote.gstPct}%)`} value={quote.gst} />
        <Row strong label="Total" value={quote.total} />
      </div>
      {action}
      <span className="flex items-center gap-1.5 text-[13px] md:text-xs text-muted"><Truck className="w-3.5 h-3.5" />Ships in {quote.delivery}</span>
      {quote.summary && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[13px] md:text-xs">
          {Object.entries(quote.summary).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink text-right">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </FadeIn>
  )
}
