import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'framer-motion'
import { X } from 'lucide-react'
import { sheetEase, spring } from '../motion/tokens'
import { useIsDesktop } from '../../lib/useMediaQuery'
import IconButton from './IconButton'
import useFocusTrap from './useFocusTrap'

const WIDTHS = { sm: 'md:max-w-sm', md: 'md:max-w-lg', lg: 'md:max-w-2xl' }
const desktop = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring.sheet },
  exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.14 } },
}
const phone = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.32, ease: sheetEase } },
  exit: { y: '100%', transition: { duration: 0.24, ease: sheetEase } },
}

function Panel({ onClose, title, description, footer, size, dismissable, children }) {
  const ref = useRef(null)
  const id = useId()
  const wide = useIsDesktop()
  useFocusTrap(ref, true, dismissable ? onClose : undefined)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <m.div
        className="absolute inset-0 bg-[#1f1f1f]/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={dismissable ? onClose : undefined}
      />
      <m.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? id : undefined}
        tabIndex={-1}
        {...(wide ? desktop : phone)}
        className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-float outline-none md:rounded-xl md:border md:border-line ${WIDTHS[size]}`}
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line-strong md:hidden" aria-hidden="true" />
        {(title || dismissable) && (
          <header className="flex items-start gap-3 px-4 pt-3 pb-2 md:px-5 md:pt-5">
            <div className="min-w-0 flex-1">
              {title && <h2 id={id} className="text-[17px] md:text-base font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-1 text-[14px] md:text-[13px] text-muted">{description}</p>}
            </div>
            {dismissable && <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-1.5 -mt-1" />}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 md:px-5">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-2 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-5 md:pb-5 [&>*]:w-full md:[&>*]:w-auto">
            {footer}
          </footer>
        )}
        {!footer && <div className="h-[max(1rem,env(safe-area-inset-bottom))] md:h-5 shrink-0" />}
      </m.div>
    </div>
  )
}

// Centred dialog on desktop, bottom sheet on phones.
export default function Dialog({ open, onClose, size = 'md', dismissable = true, ...rest }) {
  return createPortal(
    <AnimatePresence>{open && <Panel key="dialog" onClose={onClose} size={size} dismissable={dismissable} {...rest} />}</AnimatePresence>,
    document.body,
  )
}
