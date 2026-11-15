import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, IconButton, Input, Switch, useToast } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import { where } from '../model'

const FLAGS = [['makesBoard', 'Makes the board'], ['assembles', 'Assembles'], ['enabled', 'On']]

export default function OrderTypesCard() {
  const { draft, edit, errorAt } = usePricing()
  const toast = useToast()
  const error = errorAt(where.orderTypes)
  const remove = (i) => {
    const gone = draft.orderTypes[i]
    edit((d) => d.orderTypes.splice(i, 1))
    toast(`Removed ${gone.name}`, { action: { label: 'Undo', onClick: () => edit((d) => d.orderTypes.splice(i, 0, gone)) } })
  }
  return (
    <Card title="Order types" description="What the buyer is ordering. Each type says whether we make the board and whether we assemble it."
      footer={<Button variant="secondary" size="sm" icon={Plus}
        onClick={() => edit((d) => d.orderTypes.push({ name: `New type ${d.orderTypes.length + 1}`, makesBoard: true, assembles: false, enabled: false }))}>Add order type</Button>}>
      {error && <p role="alert" className="mb-2 text-xs text-[#b42318]">{error}</p>}
      <div className="divide-y divide-line">
        {draft.orderTypes.map((t, i) => (
          <div key={i} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
            <Input value={t.name} aria-label="Order type name" className="md:flex-1"
              onChange={(e) => edit((d) => { d.orderTypes[i].name = e.target.value })} />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {FLAGS.map(([k, label]) => (
                <span key={k} className="inline-flex items-center gap-2 text-[14px] md:text-[13px] text-ink">
                  <Switch checked={t[k]} onChange={(v) => edit((d) => { d.orderTypes[i][k] = v })} label={`${t.name}: ${label}`} />
                  {label}
                </span>
              ))}
              <IconButton icon={Trash2} label={`Remove ${t.name}`} size="sm" className="ml-auto" onClick={() => remove(i)} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
