import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '../../../../components/ui'
import { useIsDesktop } from '../../../../lib/useMediaQuery'

const W = 232

function Popover({ anchor, onClose, label, children }) {
  const ref = useRef(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })
  useEffect(() => {
    const node = ref.current
    node?.querySelector('input, button')?.focus({ preventScroll: true })
    const out = (e) => !node?.contains(e.target) && !anchor.contains(e.target) && close.current()
    const key = (e) => e.key === 'Escape' && (close.current(), anchor.focus())
    const gone = () => close.current()
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', key)
    window.addEventListener('resize', gone)
    window.addEventListener('scroll', gone, true)
    return () => {
      document.removeEventListener('pointerdown', out)
      document.removeEventListener('keydown', key)
      window.removeEventListener('resize', gone)
      window.removeEventListener('scroll', gone, true)
    }
  }, [anchor])
  const r = anchor.getBoundingClientRect()
  const up = r.bottom > window.innerHeight - 300
  const style = { width: W, left: Math.min(Math.max(8, r.left), window.innerWidth - W - 8), ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) }
  return createPortal(
    <div ref={ref} role="menu" aria-label={label} style={style}
      className="animate-fade-in fixed z-50 flex flex-col rounded-lg border border-line bg-white p-1 shadow-float">
      {children}
    </div>,
    document.body,
  )
}

// A small menu under the piece on desktop, a bottom sheet on phones.
export default function PieceMenu({ open, anchor, title, onClose, children }) {
  const wide = useIsDesktop()
  if (wide) return open && anchor ? <Popover anchor={anchor} onClose={onClose} label={title}>{children}</Popover> : null
  return <Dialog open={open} onClose={onClose} size="sm" title={title}><div className="flex flex-col pb-1">{children}</div></Dialog>
}

export function MenuItem({ icon: Icon, children, onClick, tone }) {
  return (
    <button type="button" role="menuitem" onClick={onClick}
      className={`press flex h-11 md:h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[15px] md:text-[13px] outline-none hover:bg-sunken focus-visible:bg-sunken ${tone === 'danger' ? 'text-[#b42318]' : 'text-ink'}`}>
      {Icon && <Icon className="h-4 w-4 md:h-3.5 md:w-3.5 shrink-0 text-faint" />}
      {children}
    </button>
  )
}
