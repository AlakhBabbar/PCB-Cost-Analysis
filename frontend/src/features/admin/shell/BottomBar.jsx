import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { Ellipsis } from 'lucide-react'
import { spring } from '../../../components/motion'
import { Sheet } from '../../../components/ui'
import { NavList } from './Sidebar'
import { TABS, href, isActive, roleAtLeast } from './nav'

const tab = 'relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/35'

function Ink() {
  return <m.span layoutId="tab-ink" transition={spring.ink} className="absolute inset-1 rounded-full bg-canvas" />
}

export default function BottomBar({ items, role }) {
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  const tabs = TABS.filter((t) => roleAtLeast(role, t.role))
  const inTabs = tabs.some((t) => isActive(pathname, t.path, t.match))
  const rest = items.filter((n) => !tabs.some((t) => t.path === n.path))

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center gap-1 rounded-full border border-line bg-white/95 p-1 shadow-float backdrop-blur">
          {tabs.map((t) => {
            const active = isActive(pathname, t.path, t.match)
            const Icon = t.icon
            return (
              <Link key={t.path} to={href(t.path)} aria-current={active ? 'page' : undefined} className={`${tab} ${active ? 'text-ink' : 'text-faint'}`}>
                {active && <Ink />}
                <Icon className={`relative h-5 w-5 ${active ? 'text-accent' : ''}`} />
                <span className="relative">{t.label}</span>
              </Link>
            )
          })}
          <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={`${tab} ${inTabs ? 'text-faint' : 'text-ink'}`}>
            {!inTabs && <Ink />}
            <Ellipsis className={`relative h-5 w-5 ${inTabs ? '' : 'text-accent'}`} />
            <span className="relative">More</span>
          </button>
        </div>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="More">
        <NavList items={rest} onNavigate={() => setMore(false)} />
      </Sheet>
    </>
  )
}
