import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button, Dialog, EmptyState, Skeleton, useConfirm, useToast } from '../../../../components/ui'
import { dateTime } from '../../../../lib/format'
import useApi from '../../../../lib/useApi'
import { getVersions, restoreVersion } from '../../../../api/pricingAdmin'
import { usePricing } from '../PricingContext'

function Versions({ token, onDone }) {
  const { dirty, apply } = usePricing()
  const { data, error, loading, reload } = useApi(() => getVersions(token), [token])
  const [busy, setBusy] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()

  const restore = async (v) => {
    const ok = await confirm({
      title: 'Restore this version?',
      message: `Prices go back to how they were on ${dateTime(v.createdAt)}.${dirty ? ' Your unsaved changes will be lost.' : ''} This is saved as a new version.`,
      confirmLabel: 'Restore',
    })
    if (!ok) return
    setBusy(v.id)
    try {
      apply(await restoreVersion(token, v.id))
      toast('Version restored')
      onDone()
    } catch (e) {
      toast(e.message || 'Could not restore', { tone: 'alert' })
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className="flex flex-col gap-3 py-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  if (error) return <EmptyState compact title="Could not load the history" description={error.message} action={<Button variant="secondary" onClick={reload}>Retry</Button>} />
  if (!data.items.length) return <EmptyState compact title="No saved versions yet" description="Every save is kept here so you can go back to it." />
  return (
    <ul className="divide-y divide-line">
      {data.items.map((v) => (
        <li key={v.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] md:text-sm font-medium text-ink">{dateTime(v.createdAt)}</p>
            <p className="truncate text-[13px] md:text-xs text-muted">{[v.adminName, v.note].filter(Boolean).join(', ') || 'No note'}</p>
          </div>
          <Button variant="secondary" size="sm" icon={RotateCcw} loading={busy === v.id} disabled={!!busy} onClick={() => restore(v)}>Restore</Button>
        </li>
      ))}
    </ul>
  )
}

export default function HistoryDialog({ open, onClose, token }) {
  return (
    <Dialog open={open} onClose={onClose} title="Price history" description="Each save of the pricing, newest first.">
      {open && <Versions token={token} onDone={onClose} />}
    </Dialog>
  )
}
