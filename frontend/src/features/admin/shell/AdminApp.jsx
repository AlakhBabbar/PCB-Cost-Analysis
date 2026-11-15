import { lazy, useCallback, useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '../../../components/ui'
import { AdminContext } from './AdminContext'
import { GuestOnly, RequireAuth, RequireRole } from './guards'
import { roleAtLeast } from './nav'
import useAuth from './useAuth'
import AdminLayout from './AdminLayout'
import LoginPage from './auth/LoginPage'
import SignupPage from './auth/SignupPage'
import PendingPage from './auth/PendingPage'

const HomePage = lazy(() => import('../home/HomePage'))
const OrdersPage = lazy(() => import('../orders/OrdersPage'))
const OrderDetailPage = lazy(() => import('../orders/OrderDetailPage'))
const AbandonedPage = lazy(() => import('../leads/AbandonedPage'))
const RequestsPage = lazy(() => import('../leads/RequestsPage'))
const CustomersPage = lazy(() => import('../customers/CustomersPage'))
const FilesPage = lazy(() => import('../files/FilesPage'))
const PricingSection = lazy(() => import('../pricing/PricingSection'))
const TeamPage = lazy(() => import('../settings/TeamPage'))
const ActivityPage = lazy(() => import('../settings/ActivityPage'))
const StorePage = lazy(() => import('../settings/StorePage'))

const gate = (min, el) => <RequireRole min={min}>{el}</RequireRole>

export default function AdminApp() {
  const auth = useAuth()
  const { token, user, role, signOut, signIn } = auth
  const can = useCallback((min) => roleAtLeast(role, min), [role])
  const value = useMemo(() => ({ token, user, role, can, signOut }), [token, user, role, can, signOut])

  if (auth.loading) return <div className="grid min-h-dvh place-items-center bg-canvas"><Spinner /></div>
  return (
    <AdminContext.Provider value={value}>
      <Routes>
        <Route path="login" element={<GuestOnly><LoginPage signIn={signIn} /></GuestOnly>} />
        <Route path="signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
        <Route path="pending" element={<GuestOnly><PendingPage /></GuestOnly>} />
        <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<HomePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="abandoned" element={<AbandonedPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="pricing/*" element={gate('manager', <PricingSection />)} />
          <Route path="team" element={gate('owner', <TeamPage />)} />
          <Route path="activity" element={gate('manager', <ActivityPage />)} />
          <Route path="store" element={<StorePage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AdminContext.Provider>
  )
}
