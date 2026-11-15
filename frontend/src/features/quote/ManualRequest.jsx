import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { DrawCheck, FadeIn } from '../../components/motion'
import { sendCheckout } from '../../api/checkout'
import { compact, isEmail, phoneDigits } from './contact'
import { errorText } from '../../lib/errorText'
import { newSession, sessionId } from './session'

function Sent() {
  return (
    <FadeIn className="flex flex-col items-center gap-3 py-4 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent"><DrawCheck size={22} /></span>
      <p className="text-[15px] md:text-sm font-semibold text-ink">We will get back to you</p>
      <p className="text-[14px] md:text-[13px] text-muted">Our team will look at your board and reply with a price.</p>
    </FadeIn>
  )
}

export default function ManualRequest({ reason, quoteBody, sent, onSent }) {
  const [form, setForm] = useState({ name: '', reach: '', note: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  if (sent) return <Sent />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    const email = isEmail(form.reach) ? form.reach.trim() : null
    const phone = email ? null : phoneDigits(form.reach)
    if (!email && !phone) return setError('Enter an email address or a 10 digit mobile number.')
    const [firstName, ...rest] = form.name.trim().split(/\s+/)
    setError(null)
    setBusy(true)
    try {
      await sendCheckout({
        kind: 'manual',
        contact: compact({ firstName, lastName: rest.join(' '), email, phone }),
        note: form.note.trim() || undefined,
        quote: quoteBody,
      }, sessionId())
      newSession()
      onSent()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex gap-3 rounded-lg bg-canvas p-3">
        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[15px] md:text-sm font-semibold text-ink">This one needs a quick look from our team</p>
          {reason && <p className="mt-0.5 text-[14px] md:text-[13px] text-muted">{reason}</p>}
        </div>
      </div>
      <Field label="Your name" htmlFor="m-name">
        <Input id="m-name" value={form.name} onChange={set('name')} autoComplete="name" />
      </Field>
      <Field label="Email or phone" htmlFor="m-reach" error={error}>
        <Input id="m-reach" value={form.reach} onChange={set('reach')} autoComplete="email" aria-invalid={!!error} />
      </Field>
      <Field label="Note (optional)" htmlFor="m-note">
        <Textarea id="m-note" rows={2} maxLength={1000} value={form.note} onChange={set('note')} placeholder="Anything we should know about this board" />
      </Field>
      <Button type="submit" size="lg" loading={busy} disabled={!form.name.trim() || !form.reach.trim()} className="w-full">
        Send for a price
      </Button>
    </form>
  )
}
