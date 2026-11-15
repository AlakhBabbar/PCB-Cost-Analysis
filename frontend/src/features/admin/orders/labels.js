export const PAYMENT = {
  pending: { label: 'Waiting for payment', tone: 'wait' },
  paid: { label: 'Paid', tone: 'good' },
  failed: { label: 'Payment failed', tone: 'alert' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const STAGES = [
  { value: 'new', label: 'New', tone: 'info' },
  { value: 'file_review', label: 'File check', tone: 'wait' },
  { value: 'in_production', label: 'In production', tone: 'info' },
  { value: 'quality_check', label: 'Quality check', tone: 'info' },
  { value: 'shipped', label: 'Shipped', tone: 'info' },
  { value: 'delivered', label: 'Delivered', tone: 'good' },
]
export const CANCELLED = { value: 'cancelled', label: 'Cancelled', tone: 'neutral' }

export const stageOf = (v) => STAGES.find((s) => s.value === v) ?? (v === 'cancelled' ? CANCELLED : { label: v ?? '-', tone: 'neutral' })
export const paymentOf = (v) => PAYMENT[v] ?? { label: v ?? '-', tone: 'neutral' }

export const fullName = (r) => [r?.firstName, r?.lastName].filter(Boolean).join(' ')
export const orderNo = (o) => (o.wooOrderId ? `#${o.wooOrderId}` : 'No shop order')
