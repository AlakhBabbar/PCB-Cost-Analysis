import { Link } from 'react-router-dom'
import { CircleCheck, ChevronRight } from 'lucide-react'
import { Badge, Card } from '../../../components/ui'
import { StaggerItem } from '../../../components/motion'

const TONE = { review: 'alert', paid: 'wait', abandoned: 'wait', manual: 'wait' }

export default function NeedsYou({ items }) {
  return (
    <Card title="Needs you" padding={false}>
      {items.length ? (
        <ul className="divide-y divide-line border-t border-line">
          {items.map((a, i) => (
            <StaggerItem as="li" key={a.kind} i={i} initial="hidden" animate="show">
              <Link to={a.to} className="press flex min-h-14 items-center gap-3 px-4 py-3 text-[15px] md:min-h-11 md:px-5 md:text-sm text-ink hover:bg-[#fafaf9]">
                <span className="min-w-0 flex-1">{a.label}</span>
                <Badge tone={TONE[a.kind] ?? 'neutral'}>{a.count}</Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
              </Link>
            </StaggerItem>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 px-4 pb-4 text-[15px] md:px-5 md:text-sm text-muted">
          <CircleCheck className="h-4 w-4 text-accent" />Nothing needs you right now.
        </p>
      )}
    </Card>
  )
}
