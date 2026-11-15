import { useEffect, useState } from 'react'
import { FileArchive, Lock } from 'lucide-react'
import { Button, Dialog, Field, Input, Select, Textarea } from '../../components/ui'
import { useShake } from '../../components/motion'
import { m } from 'framer-motion'
import { placeOrder } from '../../api/order'
import { inr } from '../../lib/format'
import { INDIAN_STATES } from './indianStates'
import { errorText } from '../../lib/errorText'
import { newSession, sessionId } from './session'
import useCheckoutCapture from './useCheckoutCapture'

const SAVED = 'pcb-order-customer'
const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', company: '', gstin: '',
  address1: '', address2: '', city: '', state: 'UP', postcode: '', note: '',
}

function loadSaved() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(SAVED) ?? '{}'), note: '' }
  } catch {
    return EMPTY
  }
}

const plain = (msg = '') => {
  const t = msg.replace(/^Value error, /, '')
  if (/required|at least \d+ character/i.test(t)) return 'Please fill this in'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// FastAPI 422 list to { field: message }, keyed by the last part of loc.
const fieldErrors = (detail) =>
  Array.isArray(detail)
    ? Object.fromEntries(detail.filter((d) => Array.isArray(d.loc) && d.loc.at(-1) in EMPTY).map((d) => [d.loc.at(-1), plain(d.msg)]))
    : {}

export default function OrderDialog({ open, quote, quoteBody, file, uploadId, onClose }) {
  const [form, setForm] = useState(loadSaved)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [shakeControls, shake] = useShake()
  const capture = useCheckoutCapture(quoteBody)

  const set = (key, upper) => (e) => setForm((f) => ({ ...f, [key]: upper ? e.target.value.toUpperCase() : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError(null)
    setSubmitting(true)
    try {
      const { paymentUrl } = await placeOrder({ uploadId, quote: quoteBody, customer: form }, sessionId())
      try { localStorage.setItem(SAVED, JSON.stringify({ ...form, note: '' })) } catch { /* storage blocked */ }
      newSession()
      window.location.assign(paymentUrl)
    } catch (err) {
      const byField = fieldErrors(err.detail)
      setErrors(byField)
      setError(Object.keys(byField).length ? 'Please fix the highlighted fields.' : errorText(err))
      setSubmitting(false)
      shake()
    }
  }

  const field = (key, label, { upper, ...props } = {}, className = '') => (
    <Field label={label} htmlFor={`o-${key}`} error={errors[key]} className={className}>
      <Input id={`o-${key}`} value={form[key]} onChange={set(key, upper)} aria-invalid={!!errors[key]} {...props} />
    </Field>
  )
  const leave = () => capture(form)
  // Details remembered from last time count as a started checkout as soon as the dialog opens.
  useEffect(() => { capture(loadSaved()) }, [capture])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissable={!submitting}
      title="Delivery details"
      description="You will choose a payment method on the next page."
      footer={
        <Button type="submit" form="order-form" size="lg" icon={Lock} loading={submitting} className="md:w-full">
          {submitting ? 'Creating your order' : `Continue to payment · ${inr(quote?.total)}`}
        </Button>
      }
    >
      <form id="order-form" onSubmit={submit} noValidate>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-3">
          <FileArchive className="w-5 h-5 text-faint shrink-0" />
          <div className="flex-1 min-w-0 text-[13px] md:text-xs text-muted">
            <p className="font-medium text-ink truncate">{file?.name}</p>
            <p>{quote?.quantity} boards, {quote?.summary?.Board}, ships in {quote?.delivery}</p>
          </div>
          <div className="text-right">
            <p className="text-[15px] md:text-sm font-semibold text-ink tabular-nums">{inr(quote?.total)}</p>
            <p className="text-xs text-muted">incl. GST</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {field('firstName', 'First name', { autoComplete: 'given-name', 'data-autofocus': true })}
          {field('lastName', 'Last name', { autoComplete: 'family-name' })}
          {field('email', 'Email', { type: 'email', autoComplete: 'email', onBlur: leave }, 'col-span-2 sm:col-span-1')}
          {field('phone', 'Mobile', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '10 digit number', onBlur: leave }, 'col-span-2 sm:col-span-1')}
          {field('company', 'Company (optional)', { autoComplete: 'organization' }, 'col-span-2 sm:col-span-1')}
          {field('gstin', 'GSTIN (optional)', { maxLength: 15, autoCapitalize: 'characters', spellCheck: false, upper: true, placeholder: '15 characters' }, 'col-span-2 sm:col-span-1')}
          {field('address1', 'Address', { autoComplete: 'address-line1', placeholder: 'House or building, street' }, 'col-span-2')}
          {field('address2', 'Apartment, landmark (optional)', { autoComplete: 'address-line2' }, 'col-span-2')}
          {field('city', 'City', { autoComplete: 'address-level2' })}
          {field('postcode', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 })}
          <Field label="State" htmlFor="o-state" error={errors.state} className="col-span-2">
            <Select id="o-state" value={form.state} onChange={set('state')} options={INDIAN_STATES} autoComplete="address-level1" />
          </Field>
          <Field label="Order note (optional)" htmlFor="o-note" error={errors.note} className="col-span-2">
            <Textarea id="o-note" value={form.note} onChange={set('note')} rows={2} maxLength={1000} placeholder="Anything we should know about this order" />
          </Field>
        </div>

        <m.div animate={shakeControls}>
          {error && <p role="alert" className="mt-4 rounded-lg border border-line bg-canvas p-3 text-[15px] md:text-sm text-ink">{error}</p>}
        </m.div>
        <p className="mt-3 text-center text-xs text-faint">Payment is completed securely on our store.</p>
      </form>
    </Dialog>
  )
}
