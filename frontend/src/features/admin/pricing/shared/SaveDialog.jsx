import { useState } from 'react'
import { Button, Dialog, Field, Input } from '../../../../components/ui'

export default function SaveDialog({ open, onClose, onSave, busy }) {
  const [note, setNote] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (await onSave(note.trim())) setNote('')
  }
  return (
    <Dialog open={open} onClose={onClose} size="sm" title="Save pricing" description="New quotes use these numbers as soon as you save."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="pricing-save" loading={busy}>Save</Button>
      </>}>
      <form id="pricing-save" onSubmit={submit} className="pb-2">
        <Field label="What changed" help="Optional. Shown in the history so you can find this version later." htmlFor="save-note">
          <Input id="save-note" data-autofocus value={note} maxLength={200} placeholder="For example: new laminate price" onChange={(e) => setNote(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  )
}
