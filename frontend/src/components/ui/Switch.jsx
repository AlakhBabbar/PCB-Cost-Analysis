import { m } from 'framer-motion'
import { spring } from '../motion/tokens'
import { focusRing } from './styles'

export default function Switch({ checked, onChange, label, id, disabled, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors before:absolute before:-inset-2.5 before:content-[''] disabled:opacity-50 ${checked ? 'bg-accent justify-end' : 'bg-line-strong justify-start'} ${focusRing} ${className}`}
    >
      <m.span layout transition={spring.ink} className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)]" />
    </button>
  )
}
