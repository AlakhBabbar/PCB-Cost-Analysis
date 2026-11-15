import { Link, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { Cpu, ExternalLink } from 'lucide-react'
import { spring } from '../../../components/motion'
import { GROUPS, href, isActive } from './nav'

function Item({ item, active, onNavigate }) {
  const Icon = item.icon
  return (
    <Link
      to={href(item.path)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`relative flex h-11 lg:h-8 items-center gap-2.5 rounded-lg px-2.5 text-[15px] lg:text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/35 ${active ? 'text-ink' : 'text-[#4d4d4a] hover:bg-black/[.04] hover:text-ink'}`}
    >
      {active && <m.span layoutId="nav-pill" transition={spring.ink} className="absolute inset-0 rounded-lg border border-line bg-white shadow-hair" />}
      <Icon className={`relative h-4 w-4 shrink-0 ${active ? 'text-accent' : 'text-faint'}`} />
      <span className="relative min-w-0 flex-1 truncate">{item.label}</span>
      {item.tag && <span className="relative text-[11px] font-medium text-faint">{item.tag}</span>}
    </Link>
  )
}

// Grouped menu, reused by the desktop sidebar and the phone More sheet.
export function NavList({ items, onNavigate }) {
  const { pathname } = useLocation()
  const groups = [null, ...GROUPS].map((g) => [g, items.filter((n) => n.group === g)]).filter(([, list]) => list.length)
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {groups.map(([group, list]) => (
        <div key={group ?? 'top'} className="flex flex-col gap-0.5">
          {group && <p className="px-2.5 pb-1 text-[12px] lg:text-[11px] font-medium text-faint">{group}</p>}
          {list.map((n) => <Item key={n.path} item={n} active={isActive(pathname, n.path)} onNavigate={onNavigate} />)}
        </div>
      ))}
    </nav>
  )
}

export default function Sidebar({ items }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-line bg-canvas px-3 py-4 lg:flex">
      <Link to="/admin" className="mb-6 flex items-center gap-2 px-2.5 text-[14px] font-semibold text-ink">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white"><Cpu className="h-3.5 w-3.5" /></span>
        PCB Admin
      </Link>
      <div className="no-scrollbar -mx-1 flex-1 overflow-y-auto px-1"><NavList items={items} /></div>
      <a href="/" target="_blank" rel="noreferrer" className="mt-3 flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-muted hover:bg-black/[.04] hover:text-ink">
        <ExternalLink className="h-4 w-4 text-faint" />Quote page
      </a>
    </aside>
  )
}
