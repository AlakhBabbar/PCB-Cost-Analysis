import { tokens } from './tokens'

const CHIP = {
  setting: 'bg-sunken text-ink',
  line: 'bg-accent-soft text-accent',
  input: 'border border-line bg-white text-ink',
}

// Shows a formula in plain words: names become labelled chips, operators sit between them.
export default function ExprView({ expr, names, className = '' }) {
  return (
    <span className={`inline-flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-[14px] md:text-[13px] leading-6 ${className}`}>
      {tokens(expr).map((t, i) => {
        if (t.kind === 'name') {
          const n = names[t.text]
          if (!n) return <span key={i} className="font-mono text-[#b42318] underline decoration-dotted" title="Not a known name">{t.text}</span>
          return <span key={i} title={t.text} className={`inline-flex h-6 items-center rounded-md px-1.5 font-medium ${CHIP[n.kind]}`}>{n.label}</span>
        }
        if (t.kind === 'func') return <span key={i} className="font-mono font-medium text-ink">{t.text}</span>
        if (t.kind === 'text') return <span key={i} className="text-ink">"{t.text}"</span>
        if (t.kind === 'num') return <span key={i} className="tabular-nums text-ink">{t.text}</span>
        return <span key={i} className="text-muted">{t.text}</span>
      })}
    </span>
  )
}
