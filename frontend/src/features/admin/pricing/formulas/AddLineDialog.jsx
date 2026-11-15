import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import { jumpTo, ids } from '../shared/jump'
import { capital, safeKey } from '../model'

export default function AddLineDialog({ open, onClose }) {
  const { draft, edit } = usePricing()
  const sections = [...new Set(draft.formulas.map((f) => f.section))]
  const [name, setName] = useState('')
  const [section, setSection] = useState('')
  const sec = section || sections.at(-1) || ''
  const key = safeKey(name, draft)

  const add = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    edit((d) => {
      const at = d.formulas.findLastIndex((f) => f.section === sec)
      d.formulas.splice(at + 1, 0, { key, label: name.trim(), section: sec, expr: '0', help: '', locked: false })
    })
    setName('')
    onClose()
    jumpTo(ids.line(key))
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm" title="Add a line" description="A new line starts at 0. Other lines and rules can use it once it is above them."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="add-line" disabled={!name.trim()}>Add line</Button>
      </>}>
      <form id="add-line" onSubmit={add} className="flex flex-col gap-4 pb-2">
        <Field label="Name" htmlFor="line-new-name" help={name.trim() ? `Formulas refer to it as ${key}.` : 'For example: Freight per board'}>
          <Input id="line-new-name" data-autofocus value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Group" htmlFor="line-new-section" help="The line goes at the end of this group.">
          <Select id="line-new-section" value={sec} options={sections.map((s) => ({ value: s, label: capital(s) }))} onChange={(e) => setSection(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  )
}
