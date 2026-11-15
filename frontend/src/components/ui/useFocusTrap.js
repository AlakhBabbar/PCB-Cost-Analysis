import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Traps Tab inside ref, closes on Escape, locks body scroll, restores focus.
export default function useFocusTrap(ref, open, onEscape) {
  const esc = useRef(onEscape)
  useEffect(() => { esc.current = onEscape })
  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const node = ref.current
    const first = node?.querySelector('[data-autofocus]') ?? node
    first?.focus({ preventScroll: true })

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); esc.current?.() }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)]
      if (!items.length) { e.preventDefault(); return }
      const [a, z] = [items[0], items[items.length - 1]]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      before?.focus?.({ preventScroll: true })
    }
  }, [open, ref])
}
