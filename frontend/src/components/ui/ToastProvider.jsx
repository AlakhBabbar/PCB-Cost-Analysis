import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'framer-motion'
import { CircleAlert } from 'lucide-react'
import { spring } from '../motion/tokens'
import DrawCheck from '../motion/DrawCheck'
import { ToastContext } from './feedback'

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const seq = useRef(0)

  const dismiss = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), [])
  const toast = useCallback((message, { tone = 'good', action, duration = 3200 } = {}) => {
    const id = ++seq.current
    setItems((list) => [...list.slice(-2), { id, message, tone, action }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
          <AnimatePresence initial={false}>
            {items.map((t) => (
              <m.div
                key={t.id}
                layout
                role="status"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={spring.sheet}
                className="pointer-events-auto flex min-h-11 max-w-md items-center gap-2.5 rounded-xl bg-ink py-2 pl-3.5 pr-2 text-[14px] text-white shadow-float"
              >
                {t.tone === 'alert' ? <CircleAlert className="w-4 h-4 shrink-0 text-[#ff8a7a]" /> : <DrawCheck size={18} className="shrink-0 text-[#7fd8b1]" />}
                <span className="min-w-0 flex-1 pr-1.5">{t.message}</span>
                {t.action && (
                  <button type="button" onClick={() => { t.action.onClick(); dismiss(t.id) }} className="h-8 rounded-md px-2.5 text-[13px] font-semibold text-white hover:bg-white/10">
                    {t.action.label}
                  </button>
                )}
              </m.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
