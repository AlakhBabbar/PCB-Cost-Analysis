const KEY = 'pcb-visit-id'
let memo = null

const uuid = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// One id per visit, kept in localStorage, or in memory when storage is blocked.
export function sessionId() {
  if (memo) return memo
  try { memo = localStorage.getItem(KEY) } catch { memo = null }
  if (!memo) {
    memo = uuid()
    try { localStorage.setItem(KEY, memo) } catch { /* storage blocked, memory only */ }
  }
  return memo
}

// Called once a visit became an order or a quote request, so what the buyer does next is tracked as a new visit.
export function newSession() {
  memo = uuid()
  try { localStorage.setItem(KEY, memo) } catch { /* storage blocked, memory only */ }
}
