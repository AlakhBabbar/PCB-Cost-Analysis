import { Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '../../../components/motion'
import { Page, Skeleton } from '../../../components/ui'
import useMediaQuery from '../../../lib/useMediaQuery'
import { useAdmin } from './AdminContext'
import { navFor } from './nav'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomBar from './BottomBar'

function PageSkeleton() {
  return (
    <Page>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="mt-2 h-64 w-full" rounded="rounded-xl" />
    </Page>
  )
}

// Pricing keeps one key so its sub pages can share a draft without remounting the section.
const pageKey = (pathname) => (pathname.startsWith('/admin/pricing') ? 'pricing' : pathname)

export default function AdminLayout() {
  const { role } = useAdmin()
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const wide = useMediaQuery('(min-width: 1024px)')
  const items = navFor(role)

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:pl-60">
      {wide && <Sidebar items={items} />}
      <TopBar />
      <main className="px-4 pt-5 pb-32 md:px-6 md:pt-6 lg:px-8 lg:pb-16">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={pageKey(pathname)}>
            <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>
      {!wide && <BottomBar items={items} role={role} />}
    </div>
  )
}
