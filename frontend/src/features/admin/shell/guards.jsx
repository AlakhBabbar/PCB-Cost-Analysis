import { Navigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button, EmptyState } from '../../../components/ui'
import { useAdmin } from './AdminContext'

export function RequireAuth({ children }) {
  const { user } = useAdmin()
  return user ? children : <Navigate to="/admin/login" replace />
}

export function GuestOnly({ children }) {
  const { user } = useAdmin()
  return user ? <Navigate to="/admin" replace /> : children
}

export function RequireRole({ min, children }) {
  const { can } = useAdmin()
  if (can(min)) return children
  return (
    <EmptyState
      art={<span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-muted"><Lock className="h-6 w-6" /></span>}
      title="You do not have access to this page"
      description="Ask the owner of this panel to change your role if you need it."
      action={<Button variant="secondary" to="/admin">Go to Home</Button>}
    />
  )
}
