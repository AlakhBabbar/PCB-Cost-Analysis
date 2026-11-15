export const OPS = [
  { value: 'x', label: 'times' },
  { value: 'pct', label: 'plus %' },
  { value: 'add', label: 'plus INR' },
]

export const PAGES = { limits: 'Buyer options', price: 'Price rules', factory: 'Factory costs' }
export const PAGE_ROUTE = { limits: 'options', price: 'rules', factory: 'costs' }

export const INPUTS = {
  width: 'Board width (mm)',
  length: 'Board length (mm)',
  qty: 'Quantity',
  layers: 'Layers',
  makes_board: 'Makes the board (1 or 0)',
  assembles: 'Assembles (1 or 0)',
  ladder_markup_pct: 'Ladder markup for this quantity',
  option_fees: 'One time fees of chosen options',
}

export const FUNCS = [
  { key: 'min', label: 'Smallest of', text: 'min(, )', caret: 4 },
  { key: 'max', label: 'Largest of', text: 'max(, )', caret: 4 },
  { key: 'floor', label: 'Round down', text: 'floor()', caret: 6 },
  { key: 'ceil', label: 'Round up', text: 'ceil()', caret: 5 },
  { key: 'round', label: 'Round', text: 'round()', caret: 6 },
  { key: 'if', label: 'If, then, else', text: 'if(, , )', caret: 3 },
  { key: 'picked', label: 'Option picked (1 or 0)', text: 'picked("specials", "impedance")' },
  { key: 'num', label: 'Number in the picked option', text: 'num("thickness")' },
]

const RESERVED = new Set([...Object.keys(INPUTS), ...FUNCS.map((f) => f.key), 'and', 'or', 'not', 'in', 'is', 'yield', 'lambda', 'True', 'False', 'None'])

export const applyOp = (base, op, value) => (op === 'x' ? base * value : op === 'pct' ? base * (1 + value / 100) : base + value)

const plain = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
export const money = (n) => `₹${plain(n)}`
export const plusMinus = (n) => `${n >= 0 ? '+' : '-'}${plain(Math.abs(n))}`
export { plain }

export function reading(o) {
  const out = `100 becomes ${plain(applyOp(100, o.op, Number(o.value) || 0))}`
  return o.orderFee ? `${out}, plus ${money(o.orderFee)} per order` : out
}

export const opText = (op, value) => (op === 'x' ? `times ${plain(value)}` : op === 'pct' ? `plus ${plain(value)}%` : `plus ${money(value)}`)

export const where = {
  setting: (s) => `${PAGES[s.page]} > ${s.section} > ${s.label}`,
  category: (c) => `Buyer options > ${c.label}`,
  formula: (f) => `Formulas > ${f.label || f.key}`,
  rule: (i) => `Buyer options > Build rules > rule ${i + 1}`,
  ladder: 'Price rules > Quantity ladder',
  orderTypes: 'Buyer options > Order types',
}

export function knownWheres(cfg) {
  return new Set([
    ...cfg.settings.map(where.setting),
    ...cfg.categories.map(where.category),
    ...cfg.formulas.map(where.formula),
    ...cfg.rules.map((_, i) => where.rule(i)),
    where.ladder,
    where.orderTypes,
  ])
}

export function safeKey(name, cfg) {
  const taken = new Set([...RESERVED, ...cfg.settings.map((s) => s.key), ...cfg.formulas.map((f) => f.key)])
  let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'line'
  if (/^\d/.test(base)) base = `line_${base}`
  let key = base
  for (let i = 2; taken.has(key); i++) key = `${base}_${i}`
  return key
}

export function nextRuleId(rules) {
  const ids = new Set(rules.map((r) => r.id))
  let i = rules.length + 1
  while (ids.has(`r${i}`)) i++
  return `r${i}`
}

export function nameBook(cfg) {
  const book = {}
  for (const [k, label] of Object.entries(INPUTS)) book[k] = { label, kind: 'input' }
  for (const s of cfg.settings) book[s.key] = { label: s.label, kind: 'setting' }
  for (const f of cfg.formulas) book[f.key] = { label: f.label || f.key, kind: 'line' }
  return book
}

const NEUTRAL = { x: 1, pct: 0, add: 0 }

export function fitBoard(board, cfg) {
  const out = { ...board, specials: {} }
  const types = cfg.orderTypes.filter((t) => t.enabled)
  if (!types.some((t) => t.name === board.orderType)) out.orderType = types[0]?.name ?? ''
  for (const c of cfg.categories) {
    const on = c.options.filter((o) => o.enabled)
    if (c.multi) {
      for (const o of on) if (board[c.key]?.[o.name]) out.specials[o.name] = true
    } else if (!on.some((o) => o.name === board[c.key])) {
      out[c.key] = (on.find((o) => Number(o.value) === NEUTRAL[o.op] && !o.orderFee) ?? on[0])?.name ?? ''
    }
  }
  return out
}

export const STARTER_BOARD = { boardW: 100, boardL: 80, quantity: 100, specials: {} }

export const capital = (s) => (s ? s[0].toUpperCase() + s.slice(1) : 'Other')

export function runs(list, keyOf) {
  const out = []
  list.forEach((item, i) => {
    const k = keyOf(item)
    if (!out.length || out.at(-1).key !== k) out.push({ key: k, items: [] })
    out.at(-1).items.push({ item, i })
  })
  return out
}

export const paletteGroups = (cfg, upto = cfg.formulas.length) => ({
  settings: cfg.settings.map((s) => ({ key: s.key, label: s.label })),
  lines: cfg.formulas.slice(0, upto).map((f) => ({ key: f.key, label: f.label || f.key })),
  inputs: Object.entries(INPUTS).map(([key, label]) => ({ key, label })),
})
