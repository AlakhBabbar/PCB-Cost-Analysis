import { useState } from 'react'
import { Card, SegmentedControl } from '../../../components/ui'
import { BarChart } from '../../../components/art'
import { count, inrCompact, inrRound, shortDay } from '../../../lib/format'

const MODES = [{ value: 'orders', label: 'Orders' }, { value: 'revenue', label: 'Money' }]

export default function TrendCard({ series }) {
  const [mode, setMode] = useState('orders')
  const money = mode === 'revenue'
  const data = series.map((s) => ({ label: shortDay(s.date), value: s[mode] ?? 0 }))
  const sum = data.reduce((a, d) => a + d.value, 0)
  return (
    <Card
      title="Last 14 days"
      description={money ? `${inrCompact(sum)} from paid orders` : `${count(sum)} orders placed`}
      actions={<SegmentedControl size="sm" label="Show" options={MODES} value={mode} onChange={setMode} />}
    >
      <BarChart key={mode} data={data} format={money ? inrRound : count} height={150} />
    </Card>
  )
}
