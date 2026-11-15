import { useState } from 'react'
import { Button, Card, Columns, EmptyState, Page, PageHeader, Skeleton, useConfirm, useToast } from '../../../components/ui'
import { approveUser, getUsers, removeUser, setRole } from '../../../api/team'
import useApi from '../../../lib/useApi'
import { useAdmin } from '../shell/AdminContext'
import { errorText } from '../../../lib/errorText'
import PendingCard from './team/PendingCard'
import PeopleCard from './team/PeopleCard'
import RolesCard from './team/RolesCard'
import { roleLabel } from './team/roles'

export default function TeamPage() {
  const { token } = useAdmin()
  const toast = useToast()
  const confirm = useConfirm()
  const { data, error, loading, reload, setData } = useApi(() => getUsers(token), [token])
  const [busy, setBusy] = useState(null)
  const users = data?.users ?? []

  const replace = (u) => setData((d) => ({ users: d.users.map((x) => (x.id === u.id ? u : x)) }))
  const drop = (id) => setData((d) => ({ users: d.users.filter((x) => x.id !== id) }))
  const run = async (id, call, done, message) => {
    setBusy(id)
    try {
      done(await call())
      toast(message)
      return true
    } catch (e) {
      toast(errorText(e), { tone: 'alert' })
      return false
    } finally {
      setBusy(null)
    }
  }

  const approve = (u, role) => run(u.id, () => approveUser(token, u.id, role), replace, `${u.name} can now sign in as ${roleLabel(role)}`)

  const decline = async (u) => {
    const ok = await confirm({ title: 'Decline this request?', message: `${u.name} will not be able to sign in. They can sign up again later.`, confirmLabel: 'Decline', tone: 'danger' })
    if (ok) run(u.id, () => removeUser(token, u.id), () => drop(u.id), 'Request declined')
  }

  const changeRole = async (u, role) => {
    if (u.isYou) {
      const ok = await confirm({ title: `Make yourself ${roleLabel(role)}?`, message: 'You will lose access to this page. Another owner can change it back.', confirmLabel: 'Change my role', tone: 'danger' })
      if (!ok) return
    }
    const done = await run(u.id, () => setRole(token, u.id, role), replace, `${u.name} is now ${roleLabel(role)}`)
    if (done && u.isYou) window.location.assign('/admin')
  }

  const remove = async (u) => {
    const ok = await confirm({ title: `Remove ${u.name}?`, message: 'They will be signed out and will not be able to sign in again unless they sign up and you approve them.', confirmLabel: 'Remove', tone: 'danger' })
    if (ok) run(u.id, () => removeUser(token, u.id), () => drop(u.id), `${u.name} was removed`)
  }

  const pending = users.filter((u) => u.status === 'pending')
  const people = users.filter((u) => u.status === 'approved')
  const main = error ? (
    <Card>
      <EmptyState compact title="Could not load your team" description={errorText(error)}
        action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
    </Card>
  ) : loading && !data ? (
    <Card title="People">
      <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
    </Card>
  ) : (
    <>
      {pending.length > 0 && <PendingCard users={pending} busy={busy} onApprove={approve} onDecline={decline} />}
      <PeopleCard users={people} busy={busy} onRole={changeRole} onRemove={remove} />
    </>
  )

  return (
    <Page width="narrow">
      <PageHeader title="Team" description="Who can sign in and what they can change." />
      <Columns main={main} side={<RolesCard />} />
    </Page>
  )
}
