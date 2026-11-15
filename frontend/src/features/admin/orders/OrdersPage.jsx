import { useNavigate } from 'react-router-dom'
import { DataTable, Money, Page, PageHeader, Pagination, RelativeTime, SearchInput, Tabs } from '../../../components/ui'
import { EmptyOrders } from '../../../components/art'
import { dayGroup } from '../../../lib/format'
import useApi from '../../../lib/useApi'
import { listOrders } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import useListParams, { PAGE_SIZE } from './useListParams'
import ListEmpty from './ListEmpty'
import { PaymentBadge, ReviewBadge, StageBadge } from './StatusBadges'
import { fullName, orderNo } from './labels'

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Waiting for payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'review', label: 'Needs review' },
]

const customer = (o) => fullName(o) || o.email || 'No name'
const size = (o) => (o.boardW && o.boardL ? `${o.boardW} x ${o.boardL} mm, ${o.layers}L, ` : '')
const boards = (o) => (o.quantity ? `${size(o)}${o.quantity.toLocaleString('en-IN')} pcs` : '-')

const COLUMNS = [
  { key: 'no', header: 'Order', render: (o) => <span className="font-medium">{orderNo(o)}</span>, width: 110 },
  {
    key: 'customer', header: 'Customer', render: (o) => (
      <span className="block min-w-0 max-w-[260px] truncate">
        {customer(o)}{o.company && <span className="text-muted"> ({o.company})</span>}
      </span>
    ),
  },
  { key: 'board', header: 'Board', render: boards },
  { key: 'total', header: 'Total', align: 'right', render: (o) => <Money value={o.total} /> },
  { key: 'payment', header: 'Payment', render: (o) => <PaymentBadge value={o.paymentStatus} /> },
  {
    key: 'stage', header: 'Stage', render: (o) => (
      <span className="inline-flex gap-1.5"><StageBadge value={o.stage} />{o.needsReview && <ReviewBadge />}</span>
    ),
  },
  { key: 'when', header: 'When', render: (o) => <RelativeTime value={o.createdAt} className="text-muted" /> },
]

function OrderCard({ o }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-ink">{orderNo(o)}</span>
        <Money value={o.total} className="text-[15px] font-medium text-ink" />
      </div>
      <p className="mt-0.5 truncate text-[13px] text-muted">{customer(o)}, {boards(o)}, <RelativeTime value={o.createdAt} /></p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <PaymentBadge value={o.paymentStatus} />
        <StageBadge value={o.stage} />
        {o.needsReview && <ReviewBadge />}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { token } = useAdmin()
  const navigate = useNavigate()
  const { get, page, set } = useListParams()
  const status = get('status')
  const q = get('q')
  const api = useApi(() => listOrders(token, { status, q, page, size: PAGE_SIZE }), [token, status, q, page])
  const rows = api.error ? [] : api.data?.items ?? []

  return (
    <Page>
      <PageHeader title="Orders" description="Every order from the shop with its payment and where it is in the factory.">
        <Tabs items={TABS} value={TABS.some((t) => t.value === status) ? status : ''} onChange={(v) => set({ status: v })} />
      </PageHeader>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={api.loading}
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        renderCard={(o) => <OrderCard o={o} />}
        groupBy={(o) => dayGroup(o.createdAt)}
        toolbar={<SearchInput value={q} onChange={(v) => set({ q: v })} placeholder="Search name, email, phone, company or city" className="md:max-w-sm md:flex-1" />}
        empty={<ListEmpty api={api} searching={!!q} filtered={!!status} art={EmptyOrders} title="No orders yet"
          description="When a buyer places an order in the shop it shows here, so you can track payment and production." />}
        footer={<Pagination page={page} size={PAGE_SIZE} total={api.data?.total ?? 0} onPage={(p) => set({ page: p })} />}
      />
    </Page>
  )
}
