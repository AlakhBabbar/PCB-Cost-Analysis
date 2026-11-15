import { BASE_URL } from '../../../../api/client'
import { RelativeTime } from '../../../../components/ui'
import CopyText from '../CopyText'

const LOCAL = /^(localhost|127\.|10\.|192\.168\.|\[::1\])/
const webhookUrl = `${BASE_URL.replace(/\/$/, '')}/api/woo/webhook`
const isLocal = LOCAL.test(new URL(BASE_URL).hostname)

export default function WebhookSteps({ ready, lastAt }) {
  return (
    <>
      <p>
        When a buyer pays, your store tells this panel so the order shows as paid.{' '}
        {lastAt ? <>The last update arrived <RelativeTime value={lastAt} className="text-ink" />.</> : 'No update has arrived yet.'}
      </p>
      {!ready && <p>First the server needs a webhook secret: a long random password saved as WC_WEBHOOK_SECRET in backend/.env. Restart the server after adding it.</p>}
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        <li>In WordPress, open WooCommerce, then Settings, then Advanced, then Webhooks, and click Add webhook.</li>
        <li>Set Status to Active and Topic to "Order updated".</li>
        <li className="flex flex-col gap-1.5">Paste this as the Delivery URL:<CopyText value={webhookUrl} label="Copy delivery URL" /></li>
        <li>In Secret, paste the same webhook secret that the server uses, then click Save webhook.</li>
      </ol>
      {isLocal && (
        <p className="rounded-lg bg-canvas px-3 py-2">
          This panel is running on a local machine, so your store cannot reach it. Until it is online, open an order and press Check payment: it does the same job.
        </p>
      )}
    </>
  )
}
