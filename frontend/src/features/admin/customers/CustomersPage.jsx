import { useNavigate } from 'react-router-dom'
import { DataTable, Money, Page, PageHeader, Pagination, RelativeTime, SearchInput } from '../../../components/ui'
import { EmptyCustomers } from '../../../components/art'
import useApi from '../../../lib/useApi'
import { listCustomers } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import useListParams, { PAGE_SIZE } from '../orders/useListParams'
import ListEmpty from '../orders/ListEmpty'
import { fullName } from '../orders/labels'

const orders = (c) => `${c.orderCount ?? 0} order${c.orderCount === 1 ? '' : 's'}`

const COLUMNS = [
  { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{fullName(c) || c.email}</span> },
  { key: 'company', header: 'Company', render: (c) => c.company || <span className="text-faint">-</span>, hideOnPhone: true },
  {
    key: 'contact', header: 'Contact', render: (c) => (
      <span className="block max-w-[240px] truncate text-muted">{c.email}{c.phone && <span className="hidden lg:inline">, {c.phone}</span>}</span>
    ),
  },
  { key: 'orders', header: 'Orders', align: 'right', render: (c) => c.orderCount ?? 0 },
  { key: 'spent', header: 'Total spent', align: 'right', render: (c) => <Money value={c.paidTotal} /> },
  { key: 'last', header: 'Last order', render: (c) => <RelativeTime value={c.lastOrderAt} className="text-muted" /> },
]

function CustomerCard({ c }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold text-ink">{fullName(c) || c.email}</span>
        <Money value={c.paidTotal} className="shrink-0 text-[15px] font-medium text-ink" />
      </div>
      <p className="mt-0.5 truncate text-[13px] text-muted">{c.company ? `${c.company}, ` : ''}{orders(c)}, last <RelativeTime value={c.lastOrderAt} /></p>
    </div>
  )
}

export default function CustomersPage() {
  const { token } = useAdmin()
  const navigate = useNavigate()
  const { get, page, set } = useListParams()
  const q = get('q')
  const api = useApi(() => listCustomers(token, { q, page, size: PAGE_SIZE }), [token, q, page])
  const rows = api.error ? [] : api.data?.items ?? []

  return (
    <Page>
      <PageHeader title="Customers" description="Everyone who placed an order and what they spent. Tap a customer to see their orders." />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey="email"
        loading={api.loading}
        onRowClick={(c) => navigate(`/admin/orders?q=${encodeURIComponent(c.email)}`)}
        renderCard={(c) => <CustomerCard c={c} />}
        toolbar={<SearchInput value={q} onChange={(v) => set({ q: v })} placeholder="Search name, email, phone or company" className="md:max-w-sm md:flex-1" />}
        empty={<ListEmpty api={api} searching={!!q} art={EmptyCustomers} title="No customers yet"
          description="Each buyer shows here after their first order, so you can see who comes back." />}
        footer={<Pagination page={page} size={PAGE_SIZE} total={api.data?.total ?? 0} onPage={(p) => set({ page: p })} />}
      />
    </Page>
  )
}
