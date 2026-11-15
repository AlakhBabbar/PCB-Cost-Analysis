import { useState } from 'react'
import { AlertCircle, ChevronDown, Cpu, RotateCcw, ShoppingCart } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { parseGerber } from '../../api/gerber'
import useQuote from './useQuote'
import { toQuoteBody } from './defaults'
import { errorText } from '../../lib/errorText'
import { sessionId } from './session'
import OrderDialog from './OrderDialog'
import QuoteForm from './QuoteForm'
import QuoteSummary from './QuoteSummary'
import PriceBar from './PriceBar'
import UploadZone from './UploadZone'
import FileNotes from './FileNotes'
import GerberViewer from './GerberViewer'

const orderBlocker = ({ file, parsed, parsing }) =>
  !file ? 'Upload your Gerber .zip to place an order'
    : parsing ? 'Reading your file'
      : !parsed ? 'Upload your Gerber .zip again to place an order'
        : !parsed.ok || !parsed.uploadId ? 'This file cannot be ordered. See the notes under Gerber files.'
          : null

export default function QuotePage() {
  const q = useQuote()
  const maxMb = q.options?.maxUploadMb ?? 50
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [sentFor, setSentFor] = useState(null)

  const handleFile = async (f) => {
    setParseError(null)
    if (!f.name.toLowerCase().endsWith('.zip')) return setParseError('Please upload a .zip of your Gerber files.')
    if (f.size > maxMb * 1024 * 1024) return setParseError(`This file is larger than ${maxMb} MB.`)
    setFile(f)
    setParsed(null)
    setParsing(true)
    try {
      const data = await parseGerber(f, sessionId())
      setParsed(data)
      q.applyGerber(data)
    } catch (e) {
      setParseError(errorText(e))
    } finally {
      setParsing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setParsed(null)
    setParseError(null)
    q.reset()
  }

  const quoteBody = q.values ? toQuoteBody(q.values) : null
  const bodyKey = JSON.stringify(quoteBody)
  const blocker = orderBlocker({ file, parsed, parsing })
  const canOrder = q.quote && !q.quote.manual && !q.loading && !blocker
  const orderAction = (
    <div className="flex flex-col gap-1.5">
      <Button size="lg" icon={ShoppingCart} disabled={!canOrder} onClick={() => setOrdering(true)} className="w-full">
        Order now
      </Button>
      {blocker && <p className="text-center text-[13px] md:text-xs text-muted">{blocker}</p>}
    </div>
  )
  const summary = {
    quote: q.quote, loading: q.loading, error: q.error, action: orderAction,
    manual: { quoteBody, sent: sentFor === bodyKey, onSent: () => setSentFor(bodyKey) },
  }

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink pb-28 lg:pb-0">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto h-14 px-4 flex items-center gap-3">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-ink text-white"><Cpu className="w-4 h-4" /></span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] md:text-sm font-semibold leading-tight">Instant PCB quote</h1>
            <p className="hidden sm:block text-xs text-muted">Upload Gerbers or enter specs, prices update as you go</p>
          </div>
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={reset} aria-label="Reset quote">
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 lg:py-8 grid gap-4 lg:gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <Card title="Gerber files" description="Board size, layers and min hole fill in automatically">
            <UploadZone onFile={handleFile} fileName={file?.name} loading={parsing} maxMb={maxMb} />
            {parseError && (
              <p className="mt-3 flex gap-2 text-[13px] md:text-xs text-ink"><AlertCircle className="w-4 h-4 shrink-0 text-muted" />{parseError}</p>
            )}
            {parsed && <FileNotes parsed={parsed} />}
          </Card>

          <Card title="Your quote" className="hidden lg:block">
            <QuoteSummary {...summary} />
          </Card>

          <button type="button" onClick={() => setShowPreview((s) => !s)} aria-expanded={showPreview}
            className="press lg:hidden flex items-center justify-between h-11 px-4 rounded-xl border border-line bg-white shadow-hair text-[15px] font-medium text-ink">
            {showPreview ? 'Hide board preview' : 'Show board preview'}
            <ChevronDown className={`w-4 h-4 text-faint transition-transform ${showPreview ? 'rotate-180' : ''}`} />
          </button>
          <div className={showPreview ? '' : 'hidden lg:block'}>
            <GerberViewer file={file} layers={parsed?.layers} />
          </div>
        </aside>

        <QuoteForm values={q.values} onChange={q.setValue} options={q.options} error={q.optionsError} onRetry={q.retry} autoFields={q.autoFields} />
      </main>

      <PriceBar {...summary} suspended={ordering} />

      <OrderDialog open={ordering && !!canOrder} quote={q.quote} quoteBody={quoteBody} file={file}
        uploadId={parsed?.uploadId} onClose={() => setOrdering(false)} />
    </div>
  )
}
