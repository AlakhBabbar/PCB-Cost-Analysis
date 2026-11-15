import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

export default function InfoTip({ text, title, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const [shift, setShift] = useState(0)
  const ref = useRef(null)
  const popRef = useRef(null)
  const id = useId()

  useLayoutEffect(() => {
    if (!open || !popRef.current) return
    const r = popRef.current.getBoundingClientRect()
    const over = Math.max(0, r.right - window.innerWidth + 12) - Math.max(0, 12 - r.left)
    setShift(-over)
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [open])

  if (!text) return null
  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={title ? `About ${title}` : 'More info'}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="relative inline-flex items-center justify-center w-5 h-5 -my-0.5 rounded-full text-faint hover:text-ink hover:bg-sunken before:absolute before:-inset-2.5 before:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          id={id}
          ref={popRef}
          role="tooltip"
          style={{ transform: `translateX(${shift}px)` }}
          className={`absolute top-full z-30 mt-1.5 w-64 max-w-[calc(100vw-1.5rem)] rounded-lg border border-line bg-white p-3 text-xs font-normal leading-relaxed text-muted shadow-float ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {title && <span className="block mb-1 font-semibold text-ink">{title}</span>}
          {text}
        </span>
      )}
    </span>
  )
}
