import { Card, Page, PageHeader, Skeleton } from '../../../components/ui'
import useApi from '../../../lib/useApi'
import { getSummary } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import { ErrorState, SetupState } from '../orders/ListEmpty'
import TodayStats from './TodayStats'
import TrendCard from './TrendCard'
import Funnel from './Funnel'
import NeedsYou from './NeedsYou'

const today = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

function HomeSkeleton() {
  return (
    <>
      <Card padding={false} className="overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 bg-white px-4 py-4 md:px-5"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-16" /></div>
          ))}
        </div>
      </Card>
      <Card><Skeleton className="h-44 w-full" rounded="rounded-lg" /></Card>
    </>
  )
}

export default function HomePage() {
  const { token } = useAdmin()
  const api = useApi(() => getSummary(token, 14), [token])
  const s = api.data

  let body
  if (api.error && !s) body = <Card><ErrorState error={api.error} onRetry={api.reload} title="Could not load today's numbers" /></Card>
  else if (!s) body = <HomeSkeleton />
  else if (!s.ready) body = <Card><SetupState /></Card>
  else {
    body = (
      <>
        <TodayStats today={s.today} series={s.series} />
        <div className="grid min-w-0 grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-start-3 lg:row-start-1"><NeedsYou items={s.attention} /></div>
          <div className="flex min-w-0 flex-col gap-4 md:gap-5 lg:col-span-2 lg:col-start-1 lg:row-start-1">
            <TrendCard series={s.series} />
            <Funnel funnel={s.funnel} />
          </div>
        </div>
      </>
    )
  }

  return (
    <Page>
      <PageHeader title="Home" description={today()} />
      {body}
    </Page>
  )
}
