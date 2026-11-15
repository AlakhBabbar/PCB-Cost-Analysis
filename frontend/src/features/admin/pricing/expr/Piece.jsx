import OpSelect from './OpSelect'
import { TONE, chip } from './styles'

function tone(p, book) {
  if (p.kind === 'field') return TONE[book.names[p.key]?.kind] ?? TONE.bad
  if (p.kind === 'picked' || p.kind === 'chosen') return book.cats[p.cat] ? TONE.choice : TONE.bad
  if (p.kind === 'open' || p.kind === 'close') return TONE.bracket
  if (p.kind === 'prefix') return TONE.word
  return TONE[p.kind] ?? TONE.bad
}

const Glyph = ({ children, className = '' }) => <span aria-hidden="true" className={`inline-flex h-8 md:h-7 items-center text-[13px] text-faint ${className}`}>{children}</span>

export default function Piece({ p, label, book, comma, funcClose, active, onOpen, onOp }) {
  if (p.kind === 'op') return <OpSelect value={p.text} onChange={onOp} />
  if (p.kind === 'comma') return <Glyph className={comma === 'and' ? 'px-0.5' : 'px-1 font-medium text-muted'}>{comma ?? ','}</Glyph>
  if (funcClose) return <Glyph className="px-0.5 text-[15px] font-semibold">)</Glyph>
  const text = p.kind === 'open' ? '(' : p.kind === 'close' ? ')' : label
  return (
    <>
      <button type="button" aria-haspopup="menu" aria-expanded={active} title={p.kind === 'open' || p.kind === 'close' ? 'Bracket' : label}
        className={`${chip} ${tone(p, book)} ${active ? 'ring-2 ring-accent/40' : ''}`}
        onClick={(e) => onOpen(e.currentTarget)}>
        <span className="truncate">{text}</span>
      </button>
      {p.kind === 'func' && <Glyph className="-ml-0.5 text-[15px] font-semibold">(</Glyph>}
    </>
  )
}
