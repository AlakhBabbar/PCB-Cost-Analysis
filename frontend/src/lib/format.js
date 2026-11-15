const inrFmt = (digits) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const compactFmt = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
const bad = (v) => v == null || v === '' || Number.isNaN(Number(v))

export const inr = (v, digits = 2) => (bad(v) ? '-' : `₹${inrFmt(digits).format(v)}`)
export const inrRound = (v) => inr(bad(v) ? v : Math.round(v), 0)
export const inrCompact = (v) => (bad(v) ? '-' : Math.abs(v) < 1000 ? inrRound(v) : `₹${compactFmt.format(v)}`)
export const pct = (v, digits = 1) => (bad(v) ? '-' : `${Number(v).toFixed(digits)}%`)
export const num = (v) => (v == null ? '' : String(v))
export const count = (v) => (bad(v) ? '-' : Number(v).toLocaleString('en-IN'))

const UNITS = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
export const ago = (iso) => {
  if (!iso) return 'Never'
  const s = (new Date(iso) - Date.now()) / 1000
  if (Math.abs(s) < 45) return 'just now'
  const [unit, size] = UNITS.find(([, d]) => Math.abs(s) >= d) ?? UNITS[6]
  return rtf.format(Math.round(s / size), unit)
}
export const relative = ago

export const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never')
export const shortDay = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-')
export const dateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'

export const dayGroup = (iso) => {
  if (!iso) return 'Earlier'
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000)
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : day(iso)
}

export const fileSize = (bytes) => {
  if (bad(bytes)) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = Number(bytes)
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i && v < 10 ? 1 : 0)} ${units[i]}`
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
