import { fullName } from '../orders/labels'

export const contactOf = (s) => fullName(s) || s.email || s.phone || 'No contact left'

export const boardOf = (s) => {
  if (!s.boardW || !s.boardL) return 'No board yet'
  const layers = s.layers ? `, ${s.layers} layer${s.layers === '1' ? '' : 's'}` : ''
  const qty = s.quantity ? `, ${s.quantity.toLocaleString('en-IN')} pcs` : ''
  return `${s.boardW} x ${s.boardL} mm${layers}${qty}`
}

const SPECS = [
  ['orderType', 'Order type'], ['thickness', 'Thickness', ' mm'], ['copper', 'Copper', ' oz'], ['material', 'Material'],
  ['finish', 'Finish'], ['maskColor', 'Mask colour'], ['silkscreen', 'Silkscreen'], ['traceSpace', 'Trace and space', ' mil'],
  ['minHole', 'Smallest hole', ' mm'], ['ipcStd', 'Quality class'], ['testing', 'Testing'], ['express', 'Delivery'],
]

const EXTRAS = {
  impedance: 'Impedance control', blindVias: 'Blind or buried vias', goldFingers: 'Gold fingers', halfHole: 'Castellated holes',
  resinPlug: 'Resin plugged vias', metalEdge: 'Edge plating', halogenFree: 'Halogen free',
}

// The buyer's choices from the saved quote, in plain words.
export const specItems = (specs) => {
  if (!specs) return []
  const items = SPECS.filter(([k]) => specs[k]).map(([k, label, unit = '']) => ({ label, value: `${specs[k]}${unit}` }))
  const extras = Object.entries(specs.specials ?? {}).filter(([, on]) => on).map(([k]) => EXTRAS[k] ?? k)
  return extras.length ? [...items, { label: 'Extras', value: extras.join(', ') }] : items
}
