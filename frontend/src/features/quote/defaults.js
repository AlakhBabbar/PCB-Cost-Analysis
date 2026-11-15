const META = ['defaults', 'labels', 'specials']

// Form values from GET /api/pricing/options: each list starts on its default, else its first option.
export function initialQuote(options) {
  const lists = Object.entries(options).filter(([k, v]) => !META.includes(k) && Array.isArray(v))
  return {
    ...Object.fromEntries(lists.map(([k, v]) => [k, options.defaults?.[k] ?? v[0]])),
    boardW: '', boardL: '', quantity: '',
    specials: Object.fromEntries((options.specials ?? []).map((k) => [k, false])),
  }
}

export const optionLabel = (options, key, name, fallback = name) => options.labels?.[key]?.[name] ?? fallback

export const snapToOption = (value, options) =>
  options.reduce((best, o) => (Math.abs(o - value) < Math.abs(best - value) ? o : best))

export const toQuoteBody = (v) => ({ ...v, boardW: Number(v.boardW), boardL: Number(v.boardL), quantity: Number(v.quantity) })
