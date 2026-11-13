import { useEffect, useState } from 'react'
import { FileArchive, Lock, X } from 'lucide-react'
import { Button, Field, Input, Select, inputClass } from '../../components/ui'
import { placeOrder } from '../../api/order'
import { inr } from '../../lib/format'
import { INDIAN_STATES } from './indianStates'

const SAVED = 'pcb-order-customer'
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', address1: '', address2: '', city: '', state: 'UP', postcode: '', note: '' }

function loadSaved() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(SAVED) ?? '{}'), note: '' }
  } catch {
    return EMPTY
  }
}

// Turns the API's 422 list into { field: message }.
const fieldErrors = (detail) =>
  Array.isArray(detail) ? Object.fromEntries(detail.filter((d) => d.field).map((d) => [d.field, d.msg])) : {}

export default function OrderDialog({ quote, quoteBody, file, onClose }) {
  const [form, setForm] = useState(loadSaved)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError(null)
    setSubmitting(true)
    try {
      const { paymentUrl } = await placeOrder({ quote: quoteBody, customer: form, file })
      try { localStorage.setItem(SAVED, JSON.stringify({ ...form, note: '' })) } catch { /* private mode */ }
      window.location.assign(paymentUrl)
    } catch (err) {
      const byField = fieldErrors(err.detail)
      setErrors(byField)
      setError(Object.keys(byField).length ? 'Please fix the highlighted fields.' : err.status ? err.message : 'Could not reach the server. Please try again.')
      setSubmitting(false)
    }
  }

  const field = (key, label, props = {}, className = '') => (
    <Field label={label} htmlFor={`o-${key}`} error={errors[key]} className={className}>
      <Input id={`o-${key}`} value={form[key]} onChange={set(key)} aria-invalid={!!errors[key]} {...props} />
    </Field>
  )

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 animate-fade-in"
      onClick={() => !submitting && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="order-title" onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="order-title" className="text-base font-semibold text-slate-900">Delivery details</h2>
            <p className="text-xs text-slate-500 mt-0.5">You'll choose a payment method on the next page.</p>
          </div>
          <Button variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} disabled={submitting} />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <FileArchive className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0 text-xs text-slate-600">
            <p className="font-medium text-slate-800 truncate">{file.name}</p>
            <p>{quote.quantity} boards · {quote.summary?.Board} · ships in {quote.delivery}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 tabular-nums">{inr(quote.total)}</p>
            <p className="text-[11px] text-slate-500">incl. GST</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {field('firstName', 'First name', { autoComplete: 'given-name', required: true })}
          {field('lastName', 'Last name', { autoComplete: 'family-name', required: true })}
          {field('email', 'Email', { type: 'email', autoComplete: 'email', required: true }, 'col-span-2 sm:col-span-1')}
          {field('phone', 'Mobile', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '10-digit number', required: true }, 'col-span-2 sm:col-span-1')}
          {field('address1', 'Address', { autoComplete: 'address-line1', placeholder: 'House / building, street', required: true }, 'col-span-2')}
          {field('address2', 'Apartment, landmark (optional)', { autoComplete: 'address-line2' }, 'col-span-2')}
          {field('city', 'City', { autoComplete: 'address-level2', required: true })}
          {field('postcode', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6, required: true })}
          <Field label="State" htmlFor="o-state" error={errors.state} className="col-span-2">
            <Select id="o-state" value={form.state} onChange={set('state')} options={INDIAN_STATES} autoComplete="address-level1" />
          </Field>
          <Field label="Order note (optional)" htmlFor="o-note" error={errors.note} className="col-span-2">
            <textarea id="o-note" value={form.note} onChange={set('note')} rows={2} maxLength={1000}
              className={`${inputClass} h-auto py-2 resize-y`} placeholder="Anything we should know about this order" />
          </Field>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">{error}</p>}

        <Button type="submit" size="lg" icon={Lock} loading={submitting} className="mt-5 w-full">
          {submitting ? 'Creating your order…' : `Continue to payment · ${inr(quote.total)}`}
        </Button>
        <p className="mt-2 text-center text-[11px] text-slate-400">Payment is completed securely on pelectro.org</p>
      </form>
    </div>
  )
}
