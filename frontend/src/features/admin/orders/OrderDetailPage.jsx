import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { Button, Card, Columns, EmptyState, Page, PageHeader, Skeleton } from '../../../components/ui'
import { EmptyOrders } from '../../../components/art'
import { dateTime } from '../../../lib/format'
import useApi from '../../../lib/useApi'
import { getStore } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import useOrder from './useOrder'
import { ErrorState, SetupState } from './ListEmpty'
import { PaymentBadge, ReviewBadge, StageBadge } from './StatusBadges'
import { BoardCard, MoneyCard } from './OrderCards'
import FileCard from './FileCard'
import BoardPreview from './BoardPreview'
import CustomerCard from './CustomerCard'
import StageCard from './StageCard'
import NotesCard from './NotesCard'
import OrderTimeline from './OrderTimeline'
import { orderNo } from './labels'

const BACK = { to: '/admin/orders', label: 'Orders' }

const shopLink = (storeUrl, wooId) => (storeUrl && wooId ? `${storeUrl.replace(/\/$/, '')}/wp-admin/post.php?post=${wooId}&action=edit` : null)

function DetailSkeleton() {
  const block = (h) => <Card><Skeleton className={`${h} w-full`} rounded="rounded-lg" /></Card>
  return (
    <>
      <Skeleton className="h-7 w-48" />
      <Columns main={<>{block('h-56')}{block('h-40')}</>} side={<>{block('h-32')}{block('h-64')}</>} />
    </>
  )
}

function Problem({ error, reload }) {
  if (error.status === 503) return <SetupState />
  if (error.status === 404 || error.status === 422) {
    return <EmptyState art={EmptyOrders} title="This order was not found" description="It may have been removed, or the link is wrong."
      action={<Button variant="secondary" icon={ArrowLeft} to="/admin/orders">Back to orders</Button>} />
  }
  return <ErrorState error={error} onRetry={reload} title="Could not load this order" />
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { token } = useAdmin()
  const order = useOrder(id)
  const store = useApi(() => getStore(token), [token])
  const [previewing, setPreviewing] = useState(false)
  const o = order.data

  if (!o) {
    return (
      <Page width="narrow">
        {order.error ? <><PageHeader title="Order" back={BACK} /><Problem error={order.error} reload={order.reload} /></> : <DetailSkeleton />}
      </Page>
    )
  }

  const link = shopLink(store.data?.storeUrl, o.wooOrderId)
  return (
    <Page width="narrow">
      <PageHeader
        title={`Order ${orderNo(o)}`}
        description={`Placed ${dateTime(o.createdAt)}`}
        back={BACK}
        badges={<><PaymentBadge value={o.paymentStatus} /><StageBadge value={o.stage} />{o.needsReview && <ReviewBadge />}</>}
        actions={(
          <>
            {link && <Button variant="secondary" icon={ExternalLink} href={link} target="_blank" rel="noopener noreferrer">Open in shop</Button>}
            <Button icon={RefreshCw} onClick={order.sync} loading={order.syncing} disabled={!o.wooOrderId}>Check payment</Button>
          </>
        )}
      />
      <Columns
        main={(
          <>
            <BoardCard summary={o.summary} />
            <FileCard file={o.file} specs={o.specs} needsReview={o.needsReview} reasons={o.reviewReasons}
              previewing={previewing} onPreview={() => setPreviewing(true)} />
            {previewing && o.file && <BoardPreview fileId={o.file.id} />}
            <MoneyCard money={o.money ?? {}} margin={o.margin} />
          </>
        )}
        side={(
          <>
            <CustomerCard customer={o.customer ?? {}} />
            <StageCard stage={o.stage} onChange={order.setStage} />
            <NotesCard key={o.adminNote ?? ''} customerNote={o.customerNote} adminNote={o.adminNote} onSave={order.saveNote} />
            <OrderTimeline rows={o.timeline ?? []} />
          </>
        )}
      />
    </Page>
  )
}
