import { Card } from '../../../../components/ui'
import { ROLES } from './roles'

export default function RolesCard() {
  return (
    <Card title="What each role can do">
      <dl className="flex flex-col gap-3 text-[15px] md:text-[13px]">
        {ROLES.map((r) => (
          <div key={r.value}>
            <dt className="font-medium text-ink">{r.label}</dt>
            <dd className="text-muted">{r.can}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
