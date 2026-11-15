export function linePath(values, w, h, pad = 0) {
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const step = values.length > 1 ? w / (values.length - 1) : 0
  const pts = values.map((v, i) => [i * step, pad + (h - 2 * pad) * (1 - (v - min) / span)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('')
  return { line, area: `${line}L${w} ${h}L0 ${h}Z`, pts }
}

export const valueOf = (d) => Number(d?.value ?? 0)
