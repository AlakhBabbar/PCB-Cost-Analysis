import { CircleCheck, CircleDashed } from 'lucide-react'
import { Badge } from '../../../../components/ui'
import { StaggerItem } from '../../../../components/motion'

export default function CheckItem({ i, ok, title, status, children }) {
  const Icon = ok ? CircleCheck : CircleDashed
  return (
    <StaggerItem as="li" i={i} initial="hidden" animate="show" className="flex gap-3 px-4 py-4 md:px-5">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ok ? 'text-accent' : 'text-faint'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] md:text-sm font-semibold text-ink">{title}</h3>
          <Badge tone={ok ? 'good' : 'wait'}>{status ?? (ok ? 'Ready' : 'Needs setup')}</Badge>
        </div>
        <div className="mt-1.5 flex flex-col gap-3 text-[15px] md:text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </StaggerItem>
  )
}
