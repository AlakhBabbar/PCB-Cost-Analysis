import { Card } from '../../../../components/ui'
import { FadeIn } from '../../../../components/motion'
import { usePricing } from '../PricingContext'
import SettingField from '../shared/SettingField'
import SettingsGroups from '../shared/SettingsGroups'

const SWITCH = 'inhouse'
const IN_HOUSE_SECTIONS = ['Panel', 'Materials', 'Tooling']

export default function CostsPage() {
  const { draft } = usePricing()
  const sw = draft.settings.find((s) => s.key === SWITCH)
  const inhouse = sw?.value === 1
  const dim = (s) => (s.section === sw?.section ? inhouse : IN_HOUSE_SECTIONS.includes(s.section) && !inhouse)
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {sw && (
        <FadeIn>
          <Card>
            <SettingField setting={sw} />
            <p className="mt-3 text-[13px] md:text-xs text-muted">
              {inhouse ? 'Supplier prices are greyed out because you make the boards. They stay saved for later.' : 'Panel, material and tooling costs are greyed out because a supplier makes the boards. They stay saved for later.'}
            </p>
          </Card>
        </FadeIn>
      )}
      <SettingsGroups page="factory" skip={[SWITCH]} start={1} dim={dim} />
    </div>
  )
}
