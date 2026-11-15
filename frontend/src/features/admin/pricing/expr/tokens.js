const TOKEN = /\s+|"[^"]*"|\d+(?:\.\d+)?(?:[eE][-+]?\d+)?|\.\d+|[A-Za-z_]\w*|<=|>=|==|!=|[-+*/()<>,]|./g
const OPS = new Set(['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!=', 'and', 'or'])
const MATH = new Set(['min', 'max', 'floor', 'ceil', 'round', 'if'])
const VALUE = new Set(['field', 'num', 'picked', 'chosen', 'raw'])

export const isValue = (p) => !!p && VALUE.has(p.kind)
export const endsValue = (p) => !!p && (VALUE.has(p.kind) || p.kind === 'close')
export const startsValue = (p) => !!p && (VALUE.has(p.kind) || ['open', 'func', 'prefix'].includes(p.kind))
const unaryAt = (out) => !out.length || ['op', 'open', 'func', 'comma', 'prefix'].includes(out.at(-1).kind)

// picked("a", "b") and num("a") become one piece each; anything else unreadable is kept as raw text.
function stringCall(raw, i) {
  const name = raw[i]
  const s = (t) => (t?.startsWith('"') ? t.slice(1, -1) : null)
  if (raw[i + 1] !== '(') return null
  if (name === 'num' && s(raw[i + 2]) !== null && raw[i + 3] === ')') return [{ kind: 'chosen', cat: s(raw[i + 2]) }, 4]
  if (name === 'picked' && s(raw[i + 2]) !== null && raw[i + 3] === ',' && s(raw[i + 4]) !== null && raw[i + 5] === ')') {
    return [{ kind: 'picked', cat: s(raw[i + 2]), opt: s(raw[i + 4]) }, 6]
  }
  return null
}

export function parse(text = '') {
  const raw = (text.match(TOKEN) ?? []).filter((t) => t.trim())
  const out = []
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i]
    const str = (t === 'picked' || t === 'num') && stringCall(raw, i)
    if (str) { out.push(str[0]); i += str[1] - 1; continue }
    if (MATH.has(t) && raw[i + 1] === '(') { out.push({ kind: 'func', name: t }); i++; continue }
    if ((t === 'and' || t === 'or') && raw[i + 1] === 'not') { out.push({ kind: 'op', text: `${t} not` }); i++; continue }
    if (t === 'not') { out.push({ kind: 'prefix', text: 'not' }); continue }
    if ((t === '-' || t === '+') && unaryAt(out)) {
      if (/^[\d.]/.test(raw[i + 1] ?? '')) { out.push({ kind: 'num', text: t === '-' ? `-${raw[++i]}` : raw[++i] }); continue }
      out.push({ kind: 'prefix', text: t }); continue
    }
    if (OPS.has(t)) out.push({ kind: 'op', text: t })
    else if (t === '(') out.push({ kind: 'open' })
    else if (t === ')') out.push({ kind: 'close' })
    else if (t === ',') out.push({ kind: 'comma' })
    else if (/^[\d.]/.test(t)) out.push({ kind: 'num', text: t })
    else if (/^[A-Za-z_]/.test(t)) out.push({ kind: 'field', key: t })
    else out.push({ kind: 'raw', text: t })
  }
  return out
}

const TEXT = {
  field: (p) => p.key, num: (p) => p.text, op: (p) => p.text, prefix: (p) => p.text, raw: (p) => p.text,
  open: () => '(', close: () => ')', comma: () => ',', func: (p) => `${p.name}(`,
  picked: (p) => `picked("${p.cat}", "${p.opt}")`, chosen: (p) => `num("${p.cat}")`,
}
const tight = (a, b) => a.kind === 'open' || a.kind === 'func' || (a.kind === 'prefix' && a.text !== 'not') || b.kind === 'close' || b.kind === 'comma'

export function serialize(pieces) {
  return pieces.map((p, i) => (i && !tight(pieces[i - 1], p) ? ' ' : '') + TEXT[p.kind](p)).join('')
}
