import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Button, Card, IconButton, Input, Switch, useToast } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import Builder from '../expr/Builder'
import Legend from '../expr/Legend'
import { ids } from '../shared/jump'
import { nextRuleId, where } from '../model'

const ACTIONS = [{ value: 'block', label: 'Stop the order' }, { value: 'manual', label: 'Send to manual quote' }]

function ActionChip({ value, onChange }) {
  return (
    <span className="relative inline-flex">
      <select aria-label="What happens" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-8 md:h-7 cursor-pointer appearance-none rounded-md border border-line bg-white pl-2 pr-6 text-[13px] font-medium text-ink shadow-hair outline-none hover:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/35">
        {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
    </span>
  )
}

function Rule({ rule: r, index }) {
  const { draft, edit, errorAt, check } = usePricing()
  const toast = useToast()
  const set = (patch) => edit((d) => Object.assign(d.rules[index], patch))
  const remove = () => {
    edit((d) => d.rules.splice(index, 1))
    toast('Rule removed', { action: { label: 'Undo', onClick: () => edit((d) => d.rules.splice(index, 0, r)) } })
  }
  return (
    <div id={ids.rule(r.id)} className={`flex flex-col gap-2.5 py-4 ${r.enabled ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-2">
        <Input value={r.message} aria-label="What the buyer sees" className="flex-1" onChange={(e) => set({ message: e.target.value })} />
        <Switch checked={r.enabled} onChange={(v) => set({ enabled: v })} label="Rule on" className="mt-2.5 md:mt-1.5" />
        <IconButton icon={Trash2} label="Remove rule" size="sm" onClick={remove} />
      </div>
      <Builder value={r.when} onChange={(v) => set({ when: v })} upto={draft.formulas.length} joiner="and" rule
        label={`When rule ${index + 1} applies`} error={errorAt(where.rule(index))} pending={check.pending}
        lead={<><ActionChip value={r.action} onChange={(v) => set({ action: v })} /><span className="px-1 text-[13px] text-muted">when</span></>} />
    </div>
  )
}

export default function BuildRulesCard() {
  const { draft, edit } = usePricing()
  const add = () => edit((d) => d.rules.push({ id: nextRuleId(d.rules), message: 'Describe the rule for the buyer.', when: 'qty < 1', action: 'block', enabled: false }))
  return (
    <Card title="Build rules" description="Checked after every price. A rule either stops the order with its sentence, or sends the board to a manual quote."
      footer={<Button variant="secondary" size="sm" icon={Plus} onClick={add}>Add rule</Button>}>
      <Legend className="pb-1" />
      <div className="divide-y divide-line">
        {draft.rules.map((r, i) => <Rule key={r.id} rule={r} index={i} />)}
      </div>
      {!draft.rules.length && <p className="py-4 text-[15px] md:text-sm text-muted">No build rules. Every board gets a price.</p>}
    </Card>
  )
}
