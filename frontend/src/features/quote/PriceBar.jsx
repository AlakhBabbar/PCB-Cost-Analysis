import { useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { Dialog, Spinner } from '../../components/ui'
import { CountUp } from '../../components/motion'
import { inr } from '../../lib/format'
import QuoteSummary from './QuoteSummary'

function Collapsed({ quote, error }) {
  if (quote?.manual) {
    return (
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink">Needs a quick look from our team</span>
        <span className="block text-[13px] text-muted">Tap to send your board for a price</span>
      </span>
    )
  }
  if (quote) {
    return (
      <>
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-semibold text-ink">
            <CountUp value={quote.pricePerBoard} format={inr} /><span className="text-[13px] font-normal text-muted"> / board</span>
          </span>
          <span className="block text-[13px] text-muted truncate">{quote.delivery}</span>
        </span>
        <span className="text-right">
          <CountUp value={quote.total} format={inr} className="block text-[15px] font-semibold text-ink" />
          <span className="block text-xs text-muted">incl. GST</span>
        </span>
      </>
    )
  }
  const text = !error ? 'Enter board size and quantity'
    : error.blocked ? 'Change a setting to get a price. Tap for details' : 'Could not price this board. Tap for details'
  return <span className="flex-1 text-[15px] text-muted">{text}</span>
}

export default function PriceBar(props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show price breakdown"
        className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-line shadow-float text-left"
      >
        <Collapsed quote={props.quote} error={props.error} />
        {props.loading ? <Spinner size={16} /> : <ChevronUp className="w-5 h-5 text-faint" />}
      </button>
      <Dialog open={open && !props.suspended} onClose={() => setOpen(false)} title="Your quote">
        <div className="pb-2"><QuoteSummary {...props} /></div>
      </Dialog>
    </div>
  )
}
