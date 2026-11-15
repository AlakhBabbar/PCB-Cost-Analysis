import { Fragment } from 'react'
import { m } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { rowIn } from '../motion/tokens'
import { useIsDesktop } from '../../lib/useMediaQuery'
import Skeleton from './Skeleton'

const cell = (col, row) => (col.render ? col.render(row) : row[col.key])
const keyOf = (rowKey, row, i) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? i)
const alignCls = (col) => (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')
const open = (onRowClick, row) => (e) => {
  if (e.type === 'keydown' && e.key !== 'Enter') return
  onRowClick(row)
}

function DefaultCard({ row, columns }) {
  const [first, ...rest] = columns.filter((c) => !c.hideOnPhone)
  const right = rest.find((c) => c.align === 'right')
  const meta = rest.filter((c) => c !== right)
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold text-ink">{cell(first, row)}</span>
        {right && <span className="shrink-0 text-[15px] font-medium tabular-nums text-ink">{cell(right, row)}</span>}
      </div>
      {meta.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          {meta.map((c) => <span key={c.key} className="inline-flex min-w-0 items-center">{cell(c, row)}</span>)}
        </div>
      )}
    </div>
  )
}

function PhoneList({ rows, columns, rowKey, onRowClick, renderCard, groupBy }) {
  let group = null
  return (
    <ul className="divide-y divide-line">
      {rows.map((row, i) => {
        const g = groupBy?.(row)
        const head = groupBy && g !== group
        group = g
        return (
          <Fragment key={keyOf(rowKey, row, i)}>
            {head && <li className="sticky top-14 z-[1] border-b border-line bg-[#fafaf9]/95 px-4 py-1.5 text-[12px] font-medium text-muted backdrop-blur">{g}</li>}
            <m.li
              variants={rowIn}
              custom={i}
              initial="hidden"
              animate="show"
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick && open(onRowClick, row)}
              onKeyDown={onRowClick && open(onRowClick, row)}
              className={`flex min-h-16 items-center gap-3 px-4 py-3 outline-none ${onRowClick ? 'active:bg-canvas focus-visible:bg-canvas' : ''}`}
            >
              {renderCard ? renderCard(row) : <DefaultCard row={row} columns={columns} />}
              {onRowClick && <ChevronRight className="h-4 w-4 shrink-0 text-faint" />}
            </m.li>
          </Fragment>
        )
      })}
    </ul>
  )
}

function DesktopTable({ rows, columns, rowKey, onRowClick, loading, skeletonRows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line bg-[#fafaf9]">
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ width: c.width }} className={`h-9 px-3 first:pl-5 last:pr-5 font-medium text-muted whitespace-nowrap ${alignCls(c)}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={i} className="h-10">
                {columns.map((c, j) => <td key={c.key} className="px-3 first:pl-5 last:pr-5"><Skeleton className={`h-3.5 ${j === 0 ? 'w-24' : 'w-16'} ${c.align === 'right' ? 'ml-auto' : ''}`} /></td>)}
              </tr>
            ))
            : rows.map((row, i) => (
              <m.tr
                key={keyOf(rowKey, row, i)}
                variants={rowIn}
                custom={i}
                initial="hidden"
                animate="show"
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick && open(onRowClick, row)}
                onKeyDown={onRowClick && open(onRowClick, row)}
                className={`h-10 outline-none ${onRowClick ? 'cursor-pointer hover:bg-[#fafaf9] focus-visible:bg-[#f6f6f4]' : ''}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2 first:pl-5 last:pr-5 text-ink ${alignCls(c)} ${c.align === 'right' ? 'tabular-nums' : ''} ${c.className ?? ''}`}>{cell(c, row)}</td>
                ))}
              </m.tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

// columns: [{ key, header, render?(row), align?, width?, className?, hideOnPhone? }]
export default function DataTable({ columns, rows = [], rowKey = 'id', loading, skeletonRows = 6, empty, onRowClick, renderCard, groupBy, toolbar, footer, className = '' }) {
  const desktop = useIsDesktop()
  const none = !loading && rows.length === 0
  return (
    <section className={`min-w-0 overflow-clip rounded-xl border border-line bg-white shadow-hair ${className}`}>
      {toolbar && <div className="flex flex-col gap-3 border-b border-line px-4 py-3 md:flex-row md:items-center md:px-5">{toolbar}</div>}
      {none ? (
        empty
      ) : desktop ? (
        <DesktopTable rows={rows} columns={columns} rowKey={rowKey} onRowClick={onRowClick} loading={loading} skeletonRows={skeletonRows} />
      ) : loading ? (
        <ul className="divide-y divide-line">
          {Array.from({ length: skeletonRows }, (_, i) => (
            <li key={i} className="flex flex-col gap-2 px-4 py-3.5"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/5" /></li>
          ))}
        </ul>
      ) : (
        <PhoneList rows={rows} columns={columns} rowKey={rowKey} onRowClick={onRowClick} renderCard={renderCard} groupBy={groupBy} />
      )}
      {footer && !none && <div className="border-t border-line">{footer}</div>}
    </section>
  )
}
