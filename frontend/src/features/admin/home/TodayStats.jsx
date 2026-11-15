import { Link } from 'react-router-dom'
import { Card, Stat } from '../../../components/ui'
import { count, inrRound } from '../../../lib/format'

const TILES = [
  { key: 'orders', label: 'Orders today', series: 'orders', format: count, to: '/admin/orders', detail: 'Placed in the shop' },
  { key: 'revenue', label: 'Money today', series: 'revenue', format: inrRound, to: '/admin/orders?status=paid', detail: 'From paid orders' },
  { key: 'quotes', label: 'Quotes today', series: 'quotes', format: count, detail: 'Prices given' },
  { key: 'abandoned', label: 'Abandoned checkouts', format: count, to: '/admin/abandoned', detail: 'Left at checkout today' },
]

export default function TodayStats({ today, series }) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {TILES.map((t) => {
          const Tag = t.to ? Link : 'div'
          return (
            <Tag key={t.key} to={t.to} className={`min-w-0 bg-white px-4 py-4 md:px-5 ${t.to ? 'press hover:bg-[#fafaf9]' : ''}`}>
              <Stat
                label={t.label}
                value={today[t.key] ?? 0}
                format={t.format}
                detail={t.detail}
                spark={t.series ? series.map((s) => s[t.series]) : undefined}
              />
            </Tag>
          )
        })}
      </div>
    </Card>
  )
}
