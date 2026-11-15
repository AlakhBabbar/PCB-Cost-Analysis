import { dayGroup } from '../../../../lib/format'

export const groupByDay = (rows) => rows.reduce((groups, row) => {
  const label = dayGroup(row.createdAt)
  const last = groups[groups.length - 1]
  if (last?.label === label) last.rows.push(row)
  else groups.push({ label, rows: [row] })
  return groups
}, [])
