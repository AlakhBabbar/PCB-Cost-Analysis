import CopyButton from './CopyButton'

// One phone or email with a tap to call / mail link and a copy button.
export default function ContactLine({ value, kind }) {
  if (!value) return <span className="text-faint">-</span>
  const href = kind === 'phone' ? `tel:${value}` : `mailto:${value}`
  return (
    <span className="inline-flex min-w-0 max-w-full items-center justify-end gap-1">
      <a href={href} className="min-w-0 truncate text-ink hover:underline">{value}</a>
      <CopyButton value={value} label={kind === 'phone' ? 'Phone' : 'Email'} />
    </span>
  )
}
