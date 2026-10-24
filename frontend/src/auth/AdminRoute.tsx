// Layout route for admin-only pages. Use inside ProtectedRoute, which handles logged-out users.
// The API enforces admin rights too; this just keeps regular users off pages they can't use.
import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

export function AdminRoute() {
  const { user } = useAuth()
  return user?.is_admin ? <Outlet /> : <Navigate to="/" replace />
}
