import { Card } from '../../../../components/ui'
import { StaggerItem, Stagger } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import { runs } from '../model'
import SettingField from './SettingField'

// Settings of one page as cards, one per section. extra[section] adds a node to that card, dim(setting) greys a field.
export default function SettingsGroups({ page, extra = {}, dim, skip = [], start = 0 }) {
  const { draft } = usePricing()
  const list = draft.settings.filter((s) => s.page === page && !skip.includes(s.key))
  const groups = []
  for (const g of runs(list, (s) => s.section)) {
    const old = groups.find((x) => x.key === g.key)
    if (old) old.items.push(...g.items)
    else groups.push(g)
  }
  return (
    <Stagger className="flex flex-col gap-4 md:gap-5">
      {groups.map((g, i) => (
        <StaggerItem key={g.key} i={i + start}>
          <Card title={g.key}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              {g.items.map(({ item }) => (
                <div key={item.key} className={item.kind === 'switch' ? 'sm:col-span-2' : ''}>
                  <SettingField setting={item} dimmed={dim?.(item)} />
                </div>
              ))}
            </div>
            {extra[g.key]}
          </Card>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
