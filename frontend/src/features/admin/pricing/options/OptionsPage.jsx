import { Stagger, StaggerItem } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import SettingsGroups from '../shared/SettingsGroups'
import CategoryCard from './CategoryCard'
import OrderTypesCard from './OrderTypesCard'
import BuildRulesCard from './BuildRulesCard'

export default function OptionsPage() {
  const { draft } = usePricing()
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <SettingsGroups page="limits" />
      <Stagger className="flex flex-col gap-4 md:gap-5">
        <StaggerItem i={0}><OrderTypesCard /></StaggerItem>
        {draft.categories.map((c, i) => <StaggerItem key={c.key} i={i + 1}><CategoryCard index={i} /></StaggerItem>)}
        <StaggerItem i={draft.categories.length + 1}><BuildRulesCard /></StaggerItem>
      </Stagger>
    </div>
  )
}
