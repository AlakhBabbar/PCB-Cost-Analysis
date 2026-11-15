import { ago, dateTime } from '../../lib/format'

export default function RelativeTime({ value, className = '' }) {
  if (!value) return <span className={`text-muted ${className}`}>Never</span>
  return <time dateTime={value} title={dateTime(value)} className={`whitespace-nowrap ${className}`}>{ago(value)}</time>
}
