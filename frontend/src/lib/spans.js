// Number options are a value ("0.6") or a range ("0.6-0.8"). Same reading as backend/services/pricing/spans.py.
const SPAN = /^\s*(\d+(?:\.\d+)?)\s*(?:(?:-|to)\s*(\d+(?:\.\d+)?))?\s*$/

export function parseSpan(name) {
  const m = SPAN.exec(String(name ?? ''))
  if (!m) return null
  const lo = Number(m[1])
  return [lo, m[2] == null ? lo : Number(m[2])]
}

export const spanName = (lo, hi) => (hi === lo ? String(lo) : `${lo}-${hi}`)
export const showSpan = ([lo, hi]) => (lo === hi ? String(lo) : `${lo} to ${hi}`)
export const covers = (spans, v) => Number.isFinite(v) && spans.some(([lo, hi]) => lo <= v && v <= hi)
// Ranges that touch read as one stretch: 0.4 to 0.8 and 0.8 to 1.6 show as 0.4 to 1.6.
export function showSpans(spans, unit = '') {
  const merged = []
  for (const [lo, hi] of [...spans].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    const last = merged.at(-1)
    if (last && lo <= last[1]) last[1] = Math.max(last[1], hi)
    else merged.push([lo, hi])
  }
  return merged.map(showSpan).join(', ') + (unit ? ` ${unit}` : '')
}
