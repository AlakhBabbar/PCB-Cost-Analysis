import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Switch } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import useBoardQuote from '../shared/useBoardQuote'
import BoardForm from './BoardForm'
import ResultCard from './ResultCard'
import Breakdown from './Breakdown'

export default function TesterPage() {
  const { token, board, draft, saved, dirty } = usePricing()
  const [params] = useSearchParams()
  const [mine, setMine] = useState(params.get('draft') === '1' || dirty)
  const useMine = mine && dirty
  const config = useMine ? draft : saved
  const quote = useBoardQuote(token, board, useMine ? draft : null, saved)
  const minMargin = config.settings.find((s) => s.key === 'min_margin_pct')?.value ?? 0

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 md:gap-5">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor="use-mine" className="text-[15px] md:text-sm font-medium text-ink">Use my unsaved changes</label>
              <p className="mt-0.5 text-xs text-muted">{dirty ? 'Off shows the price buyers get right now.' : 'You have no unsaved changes, so this uses the saved prices.'}</p>
            </div>
            <Switch id="use-mine" checked={useMine} disabled={!dirty} onChange={setMine} label="Use my unsaved changes" />
          </div>
        </Card>
        <BoardForm config={config} />
      </div>
      <div className="flex min-w-0 flex-col gap-4 md:gap-5 lg:col-span-2">
        <ResultCard quote={quote} minMargin={minMargin} />
        {quote.result && <Breakdown lines={quote.result.lines} config={config} />}
      </div>
    </div>
  )
}
