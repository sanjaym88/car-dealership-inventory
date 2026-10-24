// Layout route: renders its child routes only for logged-in users, otherwise sends them to /login.
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }
  if (user === null) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
