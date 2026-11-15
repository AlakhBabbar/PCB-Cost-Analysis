import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { Badge, DataTable, IconButton, Page, PageHeader, Pagination, RelativeTime, SearchInput, linkClass } from '../../../components/ui'
import { EmptyFiles } from '../../../components/art'
import { dayGroup, fileSize } from '../../../lib/format'
import useApi from '../../../lib/useApi'
import { listFiles } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import useListParams, { PAGE_SIZE } from '../orders/useListParams'
import ListEmpty from '../orders/ListEmpty'
import useDownload from './useDownload'

const board = (f) => {
  if (!f.parseOk) return <Badge tone="alert">Could not read</Badge>
  const size = f.widthMm && f.heightMm ? `${Math.round(f.widthMm)} x ${Math.round(f.heightMm)} mm` : 'Size unknown'
  return f.copperLayers ? `${size}, ${f.copperLayers} layers` : size
}

const order = (f) => (f.orderId
  ? <Link to={`/admin/orders/${f.orderId}`} onClick={(e) => e.stopPropagation()} className={linkClass}>{f.wooOrderId ? `Order #${f.wooOrderId}` : 'Open order'}{f.customerName ? `, ${f.customerName}` : ''}</Link>
  : <span className="text-muted">No order yet</span>)

function Get({ f, dl }) {
  return <IconButton icon={Download} label={`Download ${f.filename}`} variant="secondary" size="sm" loading={dl.busy === f.id} onClick={() => dl.download(f.id)} />
}

function FileRow({ f, dl }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{f.filename}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span>{board(f)}</span>
          <span>{fileSize(f.sizeBytes)}</span>
          {order(f)}
        </div>
      </div>
      <Get f={f} dl={dl} />
    </div>
  )
}

export default function FilesPage() {
  const { token } = useAdmin()
  const dl = useDownload()
  const { get, page, set } = useListParams()
  const q = get('q')
  const api = useApi(() => listFiles(token, { q, page, size: PAGE_SIZE }), [token, q, page])
  const rows = api.error ? [] : api.data?.items ?? []

  const columns = [
    { key: 'name', header: 'File', render: (f) => <span className="block max-w-[280px] truncate font-medium">{f.filename}</span> },
    { key: 'size', header: 'Size', align: 'right', render: (f) => fileSize(f.sizeBytes) },
    { key: 'board', header: 'What the file says', render: board },
    { key: 'order', header: 'Order', render: order },
    { key: 'when', header: 'When', render: (f) => <RelativeTime value={f.createdAt} className="text-muted" /> },
    { key: 'get', header: '', align: 'right', width: 56, render: (f) => <Get f={f} dl={dl} /> },
  ]

  return (
    <Page>
      <PageHeader title="Files" description="Every Gerber file a buyer uploaded, with what we read from it." />
      <DataTable
        columns={columns}
        rows={rows}
        loading={api.loading}
        renderCard={(f) => <FileRow f={f} dl={dl} />}
        groupBy={(f) => dayGroup(f.createdAt)}
        toolbar={<SearchInput value={q} onChange={(v) => set({ q: v })} placeholder="Search file name" className="md:max-w-sm md:flex-1" />}
        empty={<ListEmpty api={api} searching={!!q} art={EmptyFiles} title="No files yet"
          description="When a buyer uploads a Gerber file on the quote page it is kept here for your team." />}
        footer={<Pagination page={page} size={PAGE_SIZE} total={api.data?.total ?? 0} onPage={(p) => set({ page: p })} />}
      />
    </Page>
  )
}
