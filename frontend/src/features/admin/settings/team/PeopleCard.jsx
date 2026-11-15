import { Trash2 } from 'lucide-react'
import { Badge, Card, IconButton, RelativeTime, Select } from '../../../../components/ui'
import { StaggerItem } from '../../../../components/motion'
import { ROLES } from './roles'

export default function PeopleCard({ users, busy, onRole, onRemove }) {
  const owners = users.filter((u) => u.role === 'owner').length
  return (
    <Card title="People" description="Everyone who can sign in to this panel.">
      <ul className="divide-y divide-line">
        {users.map((u, i) => {
          const lastOwner = u.role === 'owner' && owners <= 1
          return (
            <StaggerItem as="li" key={u.id} i={i} initial="hidden" animate="show" className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[15px] md:text-sm font-medium text-ink">
                  <span className="truncate">{u.name}</span>
                  {u.isYou && <Badge dot={false}>You</Badge>}
                </p>
                <p className="truncate text-[13px] md:text-xs text-muted">{u.email}</p>
                <p className="mt-0.5 text-xs text-faint">
                  {u.lastSignInAt ? <>Last signed in <RelativeTime value={u.lastSignInAt} /></> : 'Has not signed in yet'}
                  {lastOwner && ' · The only owner, so this role stays'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select aria-label={`Role for ${u.name}`} options={ROLES} value={u.role} className="w-32 flex-1 md:flex-none"
                  disabled={lastOwner || busy === u.id} onChange={(e) => onRole(u, e.target.value)} />
                {!u.isYou && (
                  <IconButton icon={Trash2} label={`Remove ${u.name}`} variant="secondary" size="sm"
                    loading={busy === u.id} disabled={lastOwner} onClick={() => onRemove(u)} />
                )}
              </div>
            </StaggerItem>
          )
        })}
      </ul>
    </Card>
  )
}
