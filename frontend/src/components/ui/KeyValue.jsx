// items: [{ label, value, hint? }] or [[label, value]]. Falsy items are skipped.
export default function KeyValue({ items, className = '' }) {
  return (
    <dl className={`divide-y divide-line text-[15px] md:text-[13px] ${className}`}>
      {items.filter(Boolean).map((it) => {
        const [label, value, hint] = Array.isArray(it) ? it : [it.label, it.value, it.hint]
        return (
          <div key={label} className="flex items-start justify-between gap-4 py-2.5 md:py-2 first:pt-0 last:pb-0">
            <dt className="shrink-0 text-muted">{label}{hint && <span className="block text-xs text-faint">{hint}</span>}</dt>
            <dd className="min-w-0 text-right text-ink break-words">{value ?? <span className="text-faint">-</span>}</dd>
          </div>
        )
      })}
    </dl>
  )
}
