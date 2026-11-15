import { usePricing } from '../PricingContext'
import SettingsGroups from '../shared/SettingsGroups'
import LadderEditor from './LadderEditor'

export default function RulesPage() {
  const { draft } = usePricing()
  const ladder = draft.settings.find((s) => s.key === 'use_markup_ladder')
  const extra = ladder?.value === 1 ? { [ladder.section]: <LadderEditor /> } : {}
  return <SettingsGroups page="price" extra={extra} />
}
