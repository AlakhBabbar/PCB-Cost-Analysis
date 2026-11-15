import { m } from 'framer-motion'
import { Check, RotateCcw, X } from 'lucide-react'
import { Button, Card, useConfirm } from '../../../components/ui'
import { spring } from '../../../components/motion'
import { STAGES } from './labels'

function Step({ step, state, last, onPick }) {
  return (
    <li className="relative">
      {!last && <span className={`absolute left-[13px] top-8 bottom-0 w-px ${state === 'done' ? 'bg-ink' : 'bg-line'}`} aria-hidden="true" />}
      <button
        type="button"
        onClick={onPick}
        aria-current={state === 'now' ? 'step' : undefined}
        className="press flex min-h-11 w-full items-center gap-3 rounded-lg py-1 pr-2 text-left outline-none focus-visible:bg-canvas"
      >
        <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border ${state === 'done' ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-faint'}`}>
          {state === 'now' && <m.span layoutId="stage-now" transition={spring.ink} className="absolute -inset-[3px] rounded-full border-2 border-accent" />}
          {state === 'done' ? <Check className="h-3.5 w-3.5" /> : <span className={`h-1.5 w-1.5 rounded-full ${state === 'now' ? 'bg-accent' : 'bg-line-strong'}`} />}
        </span>
        <span className={`text-[15px] md:text-sm ${state === 'later' ? 'text-muted' : 'font-medium text-ink'}`}>{step.label}</span>
        {state === 'now' && <span className="ml-auto text-[12px] text-faint">Now</span>}
      </button>
    </li>
  )
}

export default function StageCard({ stage, onChange }) {
  const confirm = useConfirm()
  const at = STAGES.findIndex((s) => s.value === stage)
  const cancelled = stage === 'cancelled'
  const cancel = async () => {
    const ok = await confirm({
      title: 'Cancel this order?',
      message: 'The order moves to Cancelled. Payment in the shop is not refunded from here.',
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      tone: 'danger',
    })
    if (ok) onChange('cancelled')
  }
  return (
    <Card title="Stage" description="Tap a step to move the order there.">
      {cancelled && <p className="mb-3 rounded-lg bg-sunken px-3 py-2 text-[14px] md:text-[13px] text-muted">This order is cancelled.</p>}
      <ol className={cancelled ? 'opacity-50' : ''}>
        {STAGES.map((s, i) => (
          <Step key={s.value} step={s} last={i === STAGES.length - 1} onPick={() => onChange(s.value)}
            state={cancelled ? 'later' : i < at ? 'done' : i === at ? 'now' : 'later'} />
        ))}
      </ol>
      <div className="mt-3 border-t border-line pt-3">
        {cancelled
          ? <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => onChange('new')}>Reopen as New</Button>
          : <Button variant="ghost" size="sm" icon={X} onClick={cancel}>Cancel order</Button>}
      </div>
    </Card>
  )
}
