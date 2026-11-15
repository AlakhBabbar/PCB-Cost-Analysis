import { useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Button, Dialog, Field, KeyValue, Money, Textarea } from '../../../components/ui'
import { dateTime } from '../../../lib/format'
import ContactLine from '../orders/ContactLine'
import { fullName } from '../orders/labels'
import { boardOf, contactOf, specItems } from './leadText'

const Section = ({ title, children }) => (
  <section className="border-t border-line py-4 first:border-t-0 first:pt-2">
    <h3 className="mb-2.5 text-[13px] md:text-xs font-medium text-muted">{title}</h3>
    {children}
  </section>
)

function NoteField({ lead, onSave }) {
  const [text, setText] = useState(lead.adminNote ?? '')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    await onSave(text)
    setBusy(false)
  }
  return (
    <Field label="Your note" help="Only your team sees this." htmlFor="lead-note">
      <Textarea id="lead-note" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="For example: called, will order next week" />
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={save} loading={busy} disabled={text === (lead.adminNote ?? '')}>Save note</Button>
      </div>
    </Field>
  )
}

export default function LeadDialog({ open, lead, onClose, onPatch }) {
  const specs = lead ? specItems(lead.specs) : []
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={lead && contactOf(lead)}
      description={lead && `Last active ${dateTime(lead.updatedAt)}`}
      footer={lead && (lead.handled
        ? <Button variant="secondary" icon={RotateCcw} onClick={() => onPatch(lead, { handled: false })}>Mark as not handled</Button>
        : <Button icon={Check} onClick={() => onPatch(lead, { handled: true })} data-autofocus>Mark as handled</Button>)}
    >
      {lead && (
        <>
          {lead.note && (
            <Section title="What the buyer wrote">
              <p className="whitespace-pre-wrap text-[15px] md:text-sm text-ink">{lead.note}</p>
            </Section>
          )}
          {lead.reason && (
            <Section title="Why it was not priced online">
              <p className="text-[15px] md:text-sm text-ink">{lead.reason}</p>
            </Section>
          )}
          <Section title="Contact">
            <KeyValue items={[
              { label: 'Name', value: fullName(lead) || null },
              lead.company && { label: 'Company', value: lead.company },
              { label: 'Phone', value: <ContactLine value={lead.phone} kind="phone" /> },
              { label: 'Email', value: <ContactLine value={lead.email} kind="email" /> },
            ]} />
          </Section>
          <Section title="Board">
            <KeyValue items={[
              { label: 'Board', value: boardOf(lead) },
              ...specs,
              { label: 'Price per board', value: lead.pricePerBoard != null ? <Money value={lead.pricePerBoard} /> : 'No price' },
              { label: 'Quoted total', value: lead.total != null ? <Money value={lead.total} className="font-semibold" /> : 'No price' },
              { label: 'Prices asked', value: lead.quoteCount || null },
              { label: 'First seen', value: dateTime(lead.createdAt) },
            ]} />
          </Section>
          <Section title="Follow up">
            <NoteField key={lead.id} lead={lead} onSave={(adminNote) => onPatch(lead, { adminNote })} />
          </Section>
        </>
      )}
    </Dialog>
  )
}
