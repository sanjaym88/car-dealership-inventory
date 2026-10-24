// Top-level routes. The router itself (BrowserRouter) is provided in main.tsx so tests can swap it.
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { AdminRoute } from './auth/AdminRoute'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import type { Panel } from './pages/LandingPage'
import { OrdersPage } from './pages/OrdersPage'
import { SalesPage } from './pages/SalesPage'

const PANELS: Record<string, Panel> = { '/login': 'login', '/register': 'register' }

// One LandingPage instance serves /welcome, /login and /register, so moving between them
// animates (the scene slides aside, the garage door rolls up) instead of remounting the page.
function Landing() {
  const { pathname } = useLocation()
  return <LandingPage panel={PANELS[pathname]} />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Landing />}>
          <Route path="/welcome" element={null} />
          <Route path="/login" element={null} />
          <Route path="/register" element={null} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/sales" element={<SalesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
