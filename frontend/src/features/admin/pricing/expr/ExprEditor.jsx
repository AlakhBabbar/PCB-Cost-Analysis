import { useRef } from 'react'
import { CircleAlert } from 'lucide-react'
import { Spinner, Textarea } from '../../../../components/ui'
import { DrawCheck } from '../../../../components/motion'
import ExprView from './ExprView'
import Palette from './Palette'

function Status({ error, pending }) {
  if (pending) return <p className="flex items-center gap-2 text-xs text-muted"><Spinner size={12} />Checking</p>
  if (error) return <p role="alert" className="flex items-start gap-1.5 text-xs text-[#b42318]"><CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />{error}</p>
  return <p className="flex items-center gap-1.5 text-xs text-muted"><DrawCheck size={14} className="text-accent" />This reads correctly.</p>
}

// The one formula editor, used by formula lines and build rule conditions.
export default function ExprEditor({ id, value, onChange, names, groups, error, pending, label = 'Formula' }) {
  const ref = useRef(null)
  const insert = (text, caret = text.length) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const pad = start > 0 && /[\w)]$/.test(value.slice(0, start)) ? ' ' : ''
    onChange(value.slice(0, start) + pad + text + value.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + pad.length + caret, start + pad.length + caret)
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] md:text-[13px] font-medium text-ink">{label}</label>
      <Textarea id={id} ref={ref} mono rows={3} value={value} spellCheck={false} autoCapitalize="off" autoCorrect="off"
        aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />
      <Status error={error} pending={pending} />
      {value.trim() && <div className="rounded-lg bg-canvas px-2.5 py-2"><ExprView expr={value} names={names} /></div>}
      <Palette groups={groups} onPick={insert} />
    </div>
  )
}
