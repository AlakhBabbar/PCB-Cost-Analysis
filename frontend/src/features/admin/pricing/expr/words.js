import { FUNCS, INPUTS, capital, nameBook } from '../model'

export const OP_GROUPS = [
  { label: 'Maths', ops: [['+', '+', 'plus'], ['-', '−', 'minus'], ['*', '×', 'times'], ['/', '÷', 'divided by']] },
  { label: 'Compare', ops: [['<', 'is less than'], ['>', 'is more than'], ['<=', 'is at most'], ['>=', 'is at least'], ['==', 'equals'], ['!=', 'is not']] },
  { label: 'Join', ops: [['and', 'and'], ['or', 'or'], ['and not', 'and not'], ['or not', 'or not']] },
]
const OPS = Object.fromEntries(OP_GROUPS.flatMap((g) => g.ops.map(([v, chip, word]) => [v, { chip, word: word ?? chip }])))
export const opChip = (t) => OPS[t]?.chip ?? t
export const opWord = (t) => (OPS[t] ? (OPS[t].word === OPS[t].chip ? OPS[t].word : `${OPS[t].chip} ${OPS[t].word}`) : t)

export const FUNC_HELP = {
  max: 'The bigger of two or more values',
  min: 'The smaller of two or more values',
  floor: 'Drop the part after the point',
  ceil: 'Go up to the next whole number',
  round: 'Nearest whole number',
  if: 'If something holds use one value, otherwise another',
}
export const FUNC_START = {
  max: 'max(0, 0)', min: 'min(0, 0)', floor: 'floor(0)', ceil: 'ceil(0)', round: 'round(0)', if: 'if(1, 1, 0)',
}
export const FUNC_SWAP = { max: ['min'], min: ['max'], floor: ['ceil', 'round'], ceil: ['floor', 'round'], round: ['floor', 'ceil'] }
export const funcName = (n) => FUNCS[n] ?? 'Unknown step'

export function makeBook(cfg, upto) {
  const names = nameBook(cfg)
  const cats = Object.fromEntries(cfg.categories.map((c) => [c.key, c]))
  const sections = []
  for (const s of cfg.settings) {
    const sec = sections.find((x) => x.id === s.section) ?? sections[sections.push({ id: s.section, group: 'Your settings', title: capital(s.section), items: [] }) - 1]
    sec.items.push({ key: s.key, label: s.label })
  }
  const lines = cfg.formulas.slice(0, upto).map((f) => ({ key: f.key, label: names[f.key].label }))
  sections.push({ group: 'Earlier steps', title: '', items: lines, empty: 'No lines above this one yet.' })
  sections.push({ group: 'This order', title: '', items: Object.entries(INPUTS).map(([key, label]) => ({ key, label })) })
  return { names, cats, sections }
}

const optLabel = (c, name) => {
  const o = c.options.find((x) => x.name === name)
  return o ? o.label || o.name : null
}

export function pieceLabel(p, book) {
  if (p.kind === 'field') return book.names[p.key]?.label ?? 'Not found'
  if (p.kind === 'num') return p.text
  if (p.kind === 'func') return funcName(p.name)
  if (p.kind === 'raw') return 'Not understood'
  if (p.kind === 'open' || p.kind === 'close') return 'Brackets'
  if (p.kind === 'prefix') return p.text === 'not' ? 'not' : p.text === '-' ? 'minus' : 'plus'
  const c = book.cats[p.cat]
  if (!c) return 'Unknown choice'
  if (p.kind === 'chosen') return `${c.label}${c.unit ? ` (${c.unit})` : ''} chosen`
  const o = optLabel(c, p.opt) ?? 'Unknown option'
  return c.multi ? `${o} is picked` : `${c.label} is ${o}`
}

// Server messages quote keys; show the plain names instead.
export const plainMessage = (msg, book) => msg?.replace(/"([A-Za-z_]\w*)"/g, (m, k) => (book.names[k] ? `"${book.names[k].label}"` : book.cats[k] ? `"${book.cats[k].label}"` : m))
