import { Button, Card, EmptyState, Page, PageHeader, Skeleton, linkClass } from '../../../components/ui'
import { SetupNeeded } from '../../../components/art'
import { DrawCheck } from '../../../components/motion'
import { getStore } from '../../../api/system'
import useApi from '../../../lib/useApi'
import { useAdmin } from '../shell/AdminContext'
import { errorText } from '../../../lib/errorText'
import CopyText from './CopyText'
import CheckItem from './store/CheckItem'
import WebhookSteps from './store/WebhookSteps'

const SQL = 'Open the Supabase SQL editor, paste in this file from the project and run it.'

function Summary({ missing }) {
  if (!missing) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><DrawCheck size={18} /></span>
          <div>
            <p className="text-[15px] md:text-sm font-semibold text-ink">Everything is set up</p>
            <p className="text-[13px] md:text-xs text-muted">Orders, payments and prices are all working.</p>
          </div>
        </div>
      </Card>
    )
  }
  return (
    <Card>
      <EmptyState compact art={SetupNeeded} title={`${missing} ${missing === 1 ? 'thing needs' : 'things need'} setting up`}
        description="Work through the items marked Needs setup below. Each one says exactly what to do." />
    </Card>
  )
}

export default function StorePage() {
  const { token } = useAdmin()
  const { data: s, error, loading, reload } = useApi(() => getStore(token), [token])

  let body
  if (error) {
    body = <Card><EmptyState compact title="Could not check your store" description={errorText(error)} action={<Button variant="secondary" onClick={reload}>Try again</Button>} /></Card>
  } else if (loading && !s) {
    body = <Card><div className="flex flex-col gap-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div></Card>
  } else {
    const webhookOk = s.webhookReady && !!s.lastWebhookAt
    const missing = [s.wooEnabled, webhookOk, s.pricingReady, s.recordsReady].filter((ok) => !ok).length
    body = (
      <>
        <Summary missing={missing} />
        <Card title="Checklist" description="The things that make ordering and payments work." padding={false}>
          <ul className="divide-y divide-line border-t border-line">
            <CheckItem i={0} ok={s.wooEnabled} title="WooCommerce connected">
              {s.wooEnabled
                ? <p>Orders are created in <a href={s.storeUrl} target="_blank" rel="noreferrer" className={linkClass}>{s.storeUrl}</a>, where buyers pay.</p>
                : <p>The store address and keys are missing from the server settings (WC_URL, WC_KEY, WC_SECRET and WC_PRODUCT_ID in backend/.env). Until they are added, buyers can get prices but cannot order.</p>}
            </CheckItem>
            <CheckItem i={1} ok={webhookOk} title="Payment updates arriving" status={webhookOk ? 'Working' : s.webhookReady ? 'No update yet' : 'Needs setup'}>
              <WebhookSteps ready={s.webhookReady} lastAt={s.lastWebhookAt} />
            </CheckItem>
            <CheckItem i={2} ok={s.pricingReady} title="Price tables set up">
              {s.pricingReady
                ? <p>Your prices are saved in the database and every change keeps a history.</p>
                : <><p>Buyers see the built in prices and changes cannot be saved yet. {SQL}</p><CopyText value="supabase/migrations/002_pricing_v2.sql" label="Copy file name" /></>}
            </CheckItem>
            <CheckItem i={3} ok={s.recordsReady} title="Records tables set up">
              {s.recordsReady
                ? <p>Orders, quotes, files and activity are being recorded.</p>
                : <><p>Orders, abandoned checkouts, files and activity are not recorded yet. Run this after the price tables file. {SQL}</p><CopyText value="supabase/migrations/003_records.sql" label="Copy file name" /></>}
            </CheckItem>
          </ul>
        </Card>
      </>
    )
  }

  return (
    <Page width="narrow">
      <PageHeader title="Store" description="Everything that has to be connected for orders and payments to work." />
      {body}
    </Page>
  )
}
