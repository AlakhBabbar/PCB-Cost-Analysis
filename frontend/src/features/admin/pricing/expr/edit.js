import { endsValue, startsValue } from './tokens'

const opens = (p) => p.kind === 'open' || p.kind === 'func'

export function match(ps, i) {
  const dir = ps[i].kind === 'close' ? -1 : 1
  for (let j = i + dir, depth = 0; j >= 0 && j < ps.length; j += dir) {
    const k = opens(ps[j]) ? 1 : ps[j].kind === 'close' ? -1 : 0
    if (depth === 0 && k === -dir) return j
    depth += k * dir
  }
  return -1
}

// The function a comma or slot at i sits in, with its argument count.
export function owner(ps, i) {
  for (let j = i - 1, depth = 0; j >= 0; j--) {
    if (ps[j].kind === 'close') depth++
    else if (opens(ps[j])) {
      if (depth === 0) {
        if (ps[j].kind !== 'func') return null
        const end = match(ps, j)
        let args = 1
        for (let k = j + 1, d = 0; k < (end < 0 ? ps.length : end); k++) {
          if (opens(ps[k])) d++
          else if (ps[k].kind === 'close') d--
          else if (ps[k].kind === 'comma' && d === 0) args++
        }
        return { at: j, name: ps[j].name, args }
      }
      depth--
    }
  }
  return null
}

// A value with any prefix before it, and a whole function or bracket group.
export function unit(ps, i) {
  let s = ps[i].kind === 'close' ? match(ps, i) : i
  let e = opens(ps[i]) ? match(ps, i) : i
  if (s < 0) s = i
  if (e < 0) e = i
  while (s > 0 && ps[s - 1].kind === 'prefix') s--
  return [s, e]
}

const splice = (ps, at, n, ...add) => {
  const out = [...ps]
  out.splice(at, n, ...add)
  return out
}

export function removeUnit(ps, i) {
  const [s, e] = unit(ps, i)
  const prev = ps[s - 1]
  const next = ps[e + 1]
  if (prev?.kind === 'op') return splice(ps, s - 1, e - s + 2)
  if (next?.kind === 'op') return splice(ps, s, e - s + 2)
  const f = (prev?.kind === 'comma' || next?.kind === 'comma') && owner(ps, s)
  const loose = f && ((['min', 'max'].includes(f.name) && f.args > 2) || (f.name === 'round' && f.args === 2))
  if (loose && prev?.kind === 'comma') return splice(ps, s - 1, e - s + 2)
  if (loose) return splice(ps, s, e - s + 2)
  return splice(ps, s, e - s + 1, { kind: 'num', text: '0' })
}

export function removeAt(ps, i) {
  const p = ps[i]
  if (p.kind === 'open' || p.kind === 'close') {
    const j = match(ps, i)
    return ps.filter((_, k) => k !== i && k !== j)
  }
  if (p.kind === 'prefix') return splice(ps, i, 1)
  return removeUnit(ps, i)
}

// What an insert at pos needs: an operator before it, after it, or none.
export function joinAt(ps, pos) {
  if (endsValue(ps[pos - 1])) return 'before'
  if (startsValue(ps[pos])) return 'after'
  return null
}

export function insertAt(ps, pos, add, op) {
  const join = joinAt(ps, pos)
  const o = { kind: 'op', text: op }
  return splice(ps, pos, 0, ...(join === 'before' ? [o, ...add] : join === 'after' ? [...add, o] : add))
}

export const replaceAt = (ps, i, add) => splice(ps, i, 1, ...add)
export const put = (ps, at, piece) => splice(ps, at, 0, piece)

// Adds one more value to a Larger of / Smaller of.
export function addArg(ps, i) {
  const e = match(ps, i)
  return e < 0 ? ps : splice(ps, e, 0, { kind: 'comma' }, { kind: 'num', text: '0' })
}

// Words for commas (then, otherwise, and) and which closing brackets end a function.
export function layout(ps) {
  const stack = []
  const words = {}
  const funcClose = new Set()
  ps.forEach((p, i) => {
    if (opens(p)) stack.push({ name: p.kind === 'func' ? p.name : null, n: 0 })
    else if (p.kind === 'close' && stack.pop()?.name) funcClose.add(i)
    else if (p.kind === 'comma' && stack.length) {
      const top = stack.at(-1)
      top.n++
      words[i] = top.name === 'if' ? (top.n === 1 ? 'then' : 'otherwise') : 'and'
    }
  })
  return { words, funcClose }
}

export function balance(ps) {
  let depth = 0
  for (const p of ps) {
    depth += opens(p) ? 1 : p.kind === 'close' ? -1 : 0
    if (depth < 0) return 'extra'
  }
  return depth ? 'open' : null
}
