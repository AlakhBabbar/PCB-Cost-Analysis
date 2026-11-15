import { useState } from 'react'
import { Button, Card, Field, Textarea } from '../../../components/ui'

export default function NotesCard({ customerNote, adminNote, onSave }) {
  const [text, setText] = useState(adminNote ?? '')
  const [busy, setBusy] = useState(false)
  const dirty = text !== (adminNote ?? '')
  const save = async () => {
    setBusy(true)
    await onSave(text)
    setBusy(false)
  }
  return (
    <Card title="Notes">
      {customerNote && (
        <div className="mb-4">
          <p className="text-[13px] md:text-xs font-medium text-muted">From the buyer</p>
          <p className="mt-1 whitespace-pre-wrap text-[15px] md:text-sm text-ink">{customerNote}</p>
        </div>
      )}
      <Field label="Your note" help="Only your team sees this." htmlFor="order-note">
        <Textarea id="order-note" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="For example: buyer asked for extra packing" />
      </Field>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" size="sm" onClick={save} loading={busy} disabled={!dirty}>Save note</Button>
      </div>
    </Card>
  )
}
