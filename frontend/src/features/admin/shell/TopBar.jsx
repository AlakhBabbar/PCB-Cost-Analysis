import { Link, useLocation } from 'react-router-dom'
import { Cpu } from 'lucide-react'
import { entryFor } from './nav'
import UserMenu from './UserMenu'

export default function TopBar() {
  const { pathname } = useLocation()
  const entry = entryFor(pathname)
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-6 lg:px-8">
      <Link to="/admin" aria-label="Home" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white lg:hidden">
        <Cpu className="h-4 w-4" />
      </Link>
      <p className="min-w-0 flex-1 truncate text-[15px] md:text-[13px]">
        {entry?.group && <span className="hidden text-muted md:inline">{entry.group}<span className="px-1.5 text-faint">/</span></span>}
        <span className="font-medium text-ink">{entry?.label ?? 'Admin'}</span>
      </p>
      <UserMenu />
    </header>
  )
}
