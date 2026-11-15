import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { ChevronsUpDown, ExternalLink, LogOut } from 'lucide-react'
import { spring } from '../../../components/motion'
import { initials } from '../../../lib/format'
import { useAdmin } from './AdminContext'

const ROLE = { owner: 'Owner', manager: 'Manager', staff: 'Staff' }
const row = 'flex h-11 md:h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[15px] md:text-[13px] text-ink hover:bg-canvas'

export default function UserMenu() {
  const { user, role, signOut } = useAdmin()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const name = user?.name || user?.email || 'Admin'

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex h-11 md:h-9 items-center gap-2 rounded-lg pl-1 pr-1 md:pr-2 hover:bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent/35">
        <span className="inline-flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{initials(name)}</span>
        <span className="hidden max-w-40 truncate text-[13px] font-medium text-ink md:block">{name}</span>
        <ChevronsUpDown className="hidden h-3.5 w-3.5 text-faint md:block" />
      </button>
      <AnimatePresence>
        {open && (
          <m.div role="menu" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={spring.panel}
            className="absolute right-0 top-full z-50 mt-1.5 w-64 origin-top-right rounded-xl border border-line bg-white p-1.5 shadow-float">
            <div className="px-2.5 py-2">
              <p className="truncate text-[14px] md:text-[13px] font-medium text-ink">{name}</p>
              <p className="truncate text-[13px] md:text-xs text-muted">{ROLE[role] ?? role}{user?.email && user.email !== name ? `, ${user.email}` : ''}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <a role="menuitem" href="/" target="_blank" rel="noreferrer" className={row}><ExternalLink className="h-4 w-4 text-faint" />Open quote page</a>
            <button role="menuitem" type="button" onClick={signOut} className={row}><LogOut className="h-4 w-4 text-faint" />Sign out</button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
