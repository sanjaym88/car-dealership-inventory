import { NavLink } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { buttonClass } from './buttonStyles'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 font-medium transition duration-300 ${
    isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`

export function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-4">
          <p className="text-lg font-bold tracking-tight">
            <span aria-hidden="true">🚗 </span>AutoVault
          </p>
          <nav aria-label="Main" className="flex gap-1 text-sm">
            <NavLink to="/" end className={linkClass}>Inventory</NavLink>
            <NavLink to="/orders" className={linkClass}>My orders</NavLink>
            {user?.is_admin && <NavLink to="/sales" className={linkClass}>Sales</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user?.is_admin && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-900">
              Admin
            </span>
          )}
          <span className="hidden text-slate-300 md:inline">{user?.email}</span>
          <button type="button" onClick={logout}
            className={buttonClass({ variant: 'outline', size: 'sm' })}>
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
