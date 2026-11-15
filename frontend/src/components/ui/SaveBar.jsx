import { AnimatePresence, m } from 'framer-motion'
import { spring } from '../motion/tokens'
import Spinner from './Spinner'

const btn = 'press h-10 md:h-8 rounded-lg px-3.5 text-[14px] md:text-[13px] font-medium disabled:opacity-50'

// Shows only while dirty. extra: { label, onClick } for one more action, e.g. "Try it".
export default function SaveBar({ dirty, busy, message = 'Unsaved changes', onDiscard, onSave, saveLabel = 'Save', extra }) {
  return (
    <AnimatePresence>
      {dirty && (
        <m.div
          role="region"
          aria-label="Unsaved changes"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={spring.panel}
          className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-2 rounded-xl bg-ink py-2 pl-4 pr-2 text-white shadow-float lg:bottom-5 lg:left-[calc(240px+1.5rem)] lg:right-6"
        >
          <p className="min-w-0 flex-1 truncate text-[14px] md:text-[13px] text-white/80">{message}</p>
          {extra && <button type="button" onClick={extra.onClick} disabled={busy} className={`${btn} hidden sm:inline-flex items-center text-white/80 hover:bg-white/10 hover:text-white`}>{extra.label}</button>}
          <button type="button" onClick={onDiscard} disabled={busy} className={`${btn} text-white hover:bg-white/10`}>Discard</button>
          <button type="button" onClick={onSave} disabled={busy} className={`${btn} inline-flex items-center gap-1.5 bg-white text-ink hover:bg-white/90`}>
            {busy && <Spinner size={14} className="text-ink/60" />}{saveLabel}
          </button>
        </m.div>
      )}
    </AnimatePresence>
  )
}
