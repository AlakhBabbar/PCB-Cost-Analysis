import { useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Button, Card, IconButton, Input, SegmentedControl, Switch, useToast } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import ExprEditor from '../expr/ExprEditor'
import ExprView from '../expr/ExprView'
import { ids } from '../shared/jump'
import { nextRuleId, paletteGroups, where } from '../model'

const ACTIONS = [{ value: 'block', label: 'Stop the order' }, { value: 'manual', label: 'Send to manual quote' }]

function Rule({ rule: r, index }) {
  const { draft, edit, errorAt, names, check } = usePricing()
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const set = (patch) => edit((d) => Object.assign(d.rules[index], patch))
  const error = errorAt(where.rule(index))
  const remove = () => {
    edit((d) => d.rules.splice(index, 1))
    toast('Rule removed', { action: { label: 'Undo', onClick: () => edit((d) => d.rules.splice(index, 0, r)) } })
  }
  return (
    <div id={ids.rule(r.id)} className={`flex flex-col gap-3 py-4 ${r.enabled ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-2">
        <Input value={r.message} aria-label="What the buyer sees" className="flex-1" onChange={(e) => set({ message: e.target.value })} />
        <Switch checked={r.enabled} onChange={(v) => set({ enabled: v })} label="Rule on" className="mt-2.5 md:mt-1.5" />
        <IconButton icon={Trash2} label="Remove rule" size="sm" onClick={remove} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl size="sm" label="When it applies" options={ACTIONS} value={r.action} onChange={(v) => set({ action: v })} />
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 md:h-7 items-center gap-1 self-start rounded-md px-1.5 text-[14px] md:text-[13px] font-medium text-accent hover:bg-sunken">
          Edit condition<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {!open && (
        <div className="text-[13px] md:text-xs text-muted">
          <span className="mr-1.5">Applies when</span><ExprView expr={r.when} names={names} />
          {error && <p role="alert" className="mt-1 text-xs text-[#b42318]">{error}</p>}
        </div>
      )}
      {open && (
        <ExprEditor id={`rule-when-${r.id}`} label="Applies when" value={r.when} onChange={(v) => set({ when: v })}
          names={names} groups={paletteGroups(draft)} error={error} pending={check.pending} />
      )}
    </div>
  )
}

export default function BuildRulesCard() {
  const { draft, edit } = usePricing()
  const add = () => edit((d) => d.rules.push({ id: nextRuleId(d.rules), message: 'Describe the rule for the buyer.', when: 'qty < 1', action: 'block', enabled: false }))
  return (
    <Card title="Build rules" description="Checked after every price. A rule either stops the order with its sentence, or sends the board to a manual quote."
      footer={<Button variant="secondary" size="sm" icon={Plus} onClick={add}>Add rule</Button>}>
      <div className="divide-y divide-line">
        {draft.rules.map((r, i) => <Rule key={r.id} rule={r} index={i} />)}
      </div>
      {!draft.rules.length && <p className="py-4 text-[15px] md:text-sm text-muted">No build rules. Every board gets a price.</p>}
    </Card>
  )
}
