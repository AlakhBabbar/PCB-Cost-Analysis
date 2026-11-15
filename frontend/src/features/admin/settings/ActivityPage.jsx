import { useState } from 'react'
import { Button, Card, EmptyState, Page, PageHeader, Pagination, Skeleton, Timeline } from '../../../components/ui'
import { EmptyActivity } from '../../../components/art'
import { getActivity } from '../../../api/system'
import useApi from '../../../lib/useApi'
import { useAdmin } from '../shell/AdminContext'
import { describe } from './activity/describe'
import { groupByDay } from './activity/groupByDay'
import { errorText } from '../../../lib/errorText'
import SetupCard from './SetupCard'

const SIZE = 25

function Body({ data, error, loading, reload, page, setPage }) {
  if (error) {
    return <Card><EmptyState compact title="Could not load activity" description={errorText(error)} action={<Button variant="secondary" onClick={reload}>Try again</Button>} /></Card>
  }
  if (loading && !data) {
    return <Card><div className="flex flex-col gap-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div></Card>
  }
  if (data.ready === false) return <SetupCard title="Activity is not set up yet" />
  if (!data.items.length) {
    return <Card><EmptyState art={EmptyActivity} title="Nothing has happened yet" description="Orders, payment updates and every change your team makes will show here, so you always know who did what." /></Card>
  }
  return (
    <Card padding={false}>
      <div className={`flex flex-col transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {groupByDay(data.items).map((g) => (
          <section key={g.label} className="border-b border-line last:border-0">
            <h2 className="px-4 pt-4 pb-2 text-[13px] md:text-xs font-medium text-muted md:px-5">{g.label}</h2>
            <Timeline items={g.rows.map(describe)} className="px-4 pb-4 md:px-5" />
          </section>
        ))}
      </div>
      <div className="border-t border-line">
        <Pagination page={page} size={SIZE} total={data.total} onPage={setPage} />
      </div>
    </Card>
  )
}

export default function ActivityPage() {
  const { token } = useAdmin()
  const [page, setPage] = useState(1)
  const api = useApi(() => getActivity(token, page, SIZE), [token, page])
  return (
    <Page width="narrow">
      <PageHeader title="Activity" description="Who did what and when, newest first." />
      <Body {...api} page={page} setPage={setPage} />
    </Page>
  )
}
