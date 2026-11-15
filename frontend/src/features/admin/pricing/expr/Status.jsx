import { CircleAlert } from 'lucide-react'
import { Spinner } from '../../../../components/ui'
import { DrawCheck } from '../../../../components/motion'

const BRACKETS = {
  open: 'A bracket is still open. Tap a piece and choose Close bracket after.',
  extra: 'A bracket closes before one opens. Remove it or open one earlier.',
}

// While a check runs the last answer stays, faded, so lines do not jump.
export default function Status({ error, pending, brackets }) {
  const msg = BRACKETS[brackets] ?? error
  const fade = pending && !brackets ? 'opacity-60' : ''
  const icon = pending && !brackets ? <Spinner size={12} /> : null
  if (msg) {
    return (
      <p role="alert" className={`flex items-start gap-1.5 text-[13px] md:text-xs text-[#b42318] ${fade}`}>
        {icon ?? <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />}{msg}
      </p>
    )
  }
  return <p className={`flex items-center gap-1 text-[13px] md:text-xs text-faint ${fade}`}>{icon ?? <DrawCheck size={13} className="text-accent" />}This works</p>
}
