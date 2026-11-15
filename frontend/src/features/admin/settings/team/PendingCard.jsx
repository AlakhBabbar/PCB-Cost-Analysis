import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, Card, RelativeTime, Select } from '../../../../components/ui'
import { StaggerItem } from '../../../../components/motion'
import { ROLES } from './roles'

function PendingRow({ user, i, busy, onApprove, onDecline }) {
  const [role, setRole] = useState('staff')
  return (
    <StaggerItem as="li" i={i} initial="hidden" animate="show" className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] md:text-sm font-medium text-ink">{user.name}</p>
        <p className="truncate text-[13px] md:text-xs text-muted">{user.email} · {user.phone}</p>
        {user.note && <p className="mt-1 text-[13px] md:text-xs text-muted">"{user.note}"</p>}
        <p className="mt-1 text-xs text-faint">Asked <RelativeTime value={user.createdAt} /></p>
      </div>
      <div className="flex items-center gap-2">
        <Select aria-label={`Role for ${user.name}`} options={ROLES} value={role} onChange={(e) => setRole(e.target.value)} className="w-32" disabled={busy} />
        <Button variant="secondary" size="sm" icon={Check} loading={busy} onClick={() => onApprove(user, role)}>Approve</Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDecline(user)}>Decline</Button>
      </div>
    </StaggerItem>
  )
}

export default function PendingCard({ users, busy, onApprove, onDecline }) {
  return (
    <Card title="Waiting for approval" description="These people signed up and cannot sign in until you approve them.">
      <ul className="divide-y divide-line">
        {users.map((u, i) => (
          <PendingRow key={u.id} user={u} i={i} busy={busy === u.id} onApprove={onApprove} onDecline={onDecline} />
        ))}
      </ul>
    </Card>
  )
}
