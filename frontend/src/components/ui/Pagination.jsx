import { ChevronLeft, ChevronRight } from 'lucide-react'
import IconButton from './IconButton'

// page is 1 based.
export default function Pagination({ page, size, total, onPage, className = '' }) {
  if (!total) return null
  const last = Math.max(1, Math.ceil(total / size))
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 md:px-5 text-[13px] text-muted ${className}`}>
      <span className="tabular-nums">{from}-{to} of {total.toLocaleString('en-IN')}</span>
      <div className="flex gap-1">
        <IconButton icon={ChevronLeft} label="Previous page" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        <IconButton icon={ChevronRight} label="Next page" variant="secondary" size="sm" disabled={page >= last} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  )
}
