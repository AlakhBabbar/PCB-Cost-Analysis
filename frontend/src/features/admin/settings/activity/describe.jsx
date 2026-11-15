import { Link } from 'react-router-dom'
import { linkClass } from '../../../../components/ui'
import { roleLabel } from '../team/roles'

const STAGE = {
  new: 'New', file_review: 'File review', in_production: 'In production', quality_check: 'Quality check',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
}
const PAY = { pending: 'waiting for payment', paid: 'paid', failed: 'payment failed', refunded: 'refunded', cancelled: 'cancelled' }
const PAY_TONE = { paid: 'good', failed: 'alert', refunded: 'wait', cancelled: 'neutral', pending: 'wait' }

const stage = (s) => STAGE[s] ?? s ?? 'no stage'
const pay = (s) => PAY[s] ?? s ?? 'unknown'

// Turns one activity row into a Timeline item with a plain sentence.
export function describe(row) {
  const d = row.detail ?? {}
  const who = row.adminName ?? 'Someone'
  const order = row.targetType === 'order' && row.targetId
    ? <Link to={`/admin/orders/${row.targetId}`} className={linkClass}>Open order</Link>
    : null
  const num = d.wooOrderId ? `order #${d.wooOrderId}` : 'an order'
  const say = {
    order_created: () => ({ title: `A new order came in${d.wooOrderId ? ` (#${d.wooOrderId})` : ''}`, tone: d.needsReview ? 'wait' : 'good', detail: d.needsReview ? 'Its file needs a check.' : null }),
    order_stage: () => ({ title: `${who} moved ${num} from ${stage(d.from)} to ${stage(d.to)}` }),
    order_note: () => ({ title: `${who} wrote a note on ${num}`, detail: d.note }),
    woo_webhook: () => ({ title: `Your store says ${num} is ${pay(d.to)}`, tone: PAY_TONE[d.to] }),
    woo_sync: () => ({ title: `${who} checked the payment on ${num}: ${pay(d.to)}`, tone: PAY_TONE[d.to] }),
    team_approve: () => ({ title: `${who} let ${d.name ?? 'someone'} in as ${roleLabel(d.role)}`, tone: 'good' }),
    team_role: () => ({ title: `${who} changed ${d.name ?? 'someone'} from ${roleLabel(d.from)} to ${roleLabel(d.to)}` }),
    team_remove: () => ({ title: `${who} removed ${d.name ?? 'someone'} from the team`, tone: 'alert' }),
    session_handled: () => ({ title: `${who} marked a lead as handled`, tone: 'good' }),
    session_reopened: () => ({ title: `${who} reopened a lead` }),
    session_note: () => ({ title: `${who} wrote a note on a lead`, detail: d.note }),
    pricing_saved: () => ({ title: `${who} saved new prices`, detail: d.note }),
    file_link: () => ({ title: `${who} downloaded ${d.filename ?? 'a Gerber file'}` }),
  }[row.action]
  const item = say ? say() : { title: `${who}: ${String(row.action ?? 'change').replaceAll('_', ' ')}` }
  const detail = item.detail || order ? <>{item.detail && <p>{item.detail}</p>}{order}</> : null
  return { id: row.id, time: row.createdAt, tone: item.tone ?? 'neutral', title: item.title, detail }
}
