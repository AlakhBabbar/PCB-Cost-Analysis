import { useState } from 'react'
import { Badge, DataTable, Money, Page, PageHeader, Pagination, RelativeTime, SearchInput, Tabs, useToast } from '../../../components/ui'
import { dayGroup } from '../../../lib/format'
import useApi from '../../../lib/useApi'
import { listSessions, patchSession } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import useListParams, { PAGE_SIZE } from '../orders/useListParams'
import ListEmpty from '../orders/ListEmpty'
import { errorText } from '../../../lib/errorText'
import LeadDialog from './LeadDialog'
import { boardOf, contactOf } from './leadText'

const quoted = (s) => (s.total != null ? <Money value={s.total} /> : <span className="text-muted">No price</span>)
const handledBadge = (s) => (s.handled ? <Badge tone="good">Handled</Badge> : <Badge tone="wait">To follow up</Badge>)

const COLUMNS = [
  { key: 'contact', header: 'Contact', render: (s) => <span className="block max-w-[240px] truncate font-medium">{contactOf(s)}</span> },
  { key: 'board', header: 'Board', render: boardOf },
  { key: 'total', header: 'Quoted total', align: 'right', render: quoted },
  { key: 'status', header: 'Follow up', render: handledBadge },
  { key: 'when', header: 'When', render: (s) => <RelativeTime value={s.updatedAt} className="text-muted" /> },
]

function LeadCard({ s }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold text-ink">{contactOf(s)}</span>
        <span className="shrink-0 text-[15px] font-medium">{quoted(s)}</span>
      </div>
      <p className="mt-0.5 truncate text-[13px] text-muted">{boardOf(s)}, <RelativeTime value={s.updatedAt} /></p>
      <div className="mt-1.5">{handledBadge(s)}</div>
    </div>
  )
}

// One list for abandoned checkouts and quote requests. tabs: [{ value: view, label, art, empty }], first is the default.
export default function LeadList({ title, description, tabs }) {
  const { token } = useAdmin()
  const toast = useToast()
  const { get, page, set } = useListParams()
  const tab = tabs.find((t) => t.value === get('view')) ?? tabs[0]
  const q = get('q')
  const api = useApi(() => listSessions(token, { view: tab.value, q, page, size: PAGE_SIZE }), [token, tab.value, q, page])
  const [openId, setOpenId] = useState(null)
  const [open, setOpen] = useState(false)
  const rows = api.error ? [] : api.data?.items ?? []
  const lead = rows.find((r) => r.id === openId) ?? null

  const replace = (row) => api.setData((d) => ({ ...d, items: d.items.map((r) => (r.id === row.id ? row : r)) }))
  const patch = async (row, body) => {
    replace({ ...row, ...body })
    if ('handled' in body) setOpen(false)
    try {
      replace(await patchSession(token, row.id, body))
      toast(body.handled === true ? 'Marked as handled' : body.handled === false ? 'Marked as not handled' : 'Note saved')
    } catch (err) {
      replace(row)
      toast(`Could not save. ${errorText(err)}`, { tone: 'alert' })
    }
  }

  return (
    <Page>
      <PageHeader title={title} description={description}>
        {tabs.length > 1 && <Tabs items={tabs} value={tab.value} onChange={(v) => set({ view: v === tabs[0].value ? '' : v })} />}
      </PageHeader>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={api.loading}
        onRowClick={(s) => { setOpenId(s.id); setOpen(true) }}
        renderCard={(s) => <LeadCard s={s} />}
        groupBy={(s) => dayGroup(s.updatedAt)}
        toolbar={<SearchInput value={q} onChange={(v) => set({ q: v })} placeholder="Search name, email, phone or company" className="md:max-w-sm md:flex-1" />}
        empty={<ListEmpty api={api} searching={!!q} art={tab.art} title={tab.empty[0]} description={tab.empty[1]} />}
        footer={<Pagination page={page} size={PAGE_SIZE} total={api.data?.total ?? 0} onPage={(p) => set({ page: p })} />}
      />
      <LeadDialog open={open && !!lead} lead={lead} onClose={() => setOpen(false)} onPatch={patch} />
    </Page>
  )
}
