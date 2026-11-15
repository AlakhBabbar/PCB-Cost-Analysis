import { Badge } from '../../../components/ui'
import { paymentOf, stageOf } from './labels'

export function PaymentBadge({ value }) {
  const p = paymentOf(value)
  return <Badge tone={p.tone}>{p.label}</Badge>
}

export function StageBadge({ value }) {
  const s = stageOf(value)
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export function ReviewBadge() {
  return <Badge tone="alert">Needs review</Badge>
}
