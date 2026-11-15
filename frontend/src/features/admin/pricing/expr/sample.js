import { fitBoard } from '../model'

const lead = (s) => Number(String(s ?? '').match(/\d+(\.\d+)?/)?.[0] ?? 0)

// The real numbers behind every piece for the sample board, as the engine would see them.
export function realValues(cfg, board, result) {
  const b = fitBoard(board, cfg)
  const type = cfg.orderTypes.find((t) => t.name === b.orderType)
  const tier = [...cfg.markupTiers].sort((x, y) => x.maxQty - y.maxQty).find((t) => b.quantity <= t.maxQty)
  const settings = Object.fromEntries(cfg.settings.map((s) => [s.key, Number(s.value)]))
  const isPicked = (c, o) => (c.multi ? !!b.specials?.[o.name] : b[c.key] === o.name)
  const fees = cfg.categories.flatMap((c) => c.options.filter((o) => o.enabled && isPicked(c, o))).reduce((s, o) => s + Number(o.orderFee || 0), 0)
  const fields = {
    ...settings,
    width: Number(b.boardW), length: Number(b.boardL), qty: Number(b.quantity), layers: lead(b.layers),
    makes_board: type?.makesBoard ? 1 : 0, assembles: type?.assembles ? 1 : 0,
    ladder_markup_pct: tier ? tier.markupPct : settings.markup_above_ladder_pct ?? 0,
    option_fees: fees,
  }
  for (const l of result?.lines ?? []) fields[l.key] = l.value
  const cats = Object.fromEntries(cfg.categories.map((c) => [c.key, c]))
  return {
    fields,
    picked: (cat, opt) => { const c = cats[cat]; const o = c?.options.find((x) => x.name === opt); return !!(c && o && isPicked(c, o)) },
    chosen: (cat) => (cats[cat]?.kind === 'number' ? Number(b[cat]) || 0 : lead(b[cat])),
  }
}

export const short = (v) => String(Number(Number(v).toPrecision(6)))
