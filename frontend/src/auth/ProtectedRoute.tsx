// Layout route: renders its child routes only for logged-in users, otherwise sends them to the welcome page.
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-base text-muted">
        Loading…
      </div>
    )
  }
  if (user === null) return <Navigate to="/welcome" replace state={{ from: location }} />
  return <Outlet />
}
