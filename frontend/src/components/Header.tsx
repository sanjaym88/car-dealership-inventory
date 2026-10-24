// App sidebar in the style of Watermelon UI: logo, grouped navigation with icons, and the
// signed-in user at the bottom. On small screens it becomes a top bar.
import { BarChart3, CarFront, LogOut, Receipt, Warehouse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../auth/useAuth'

function NavItem({ to, icon: Icon, children, end }: {
  to: string
  icon: LucideIcon
  children: ReactNode
  end?: boolean
}) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm transition-colors ${
          isActive ? 'bg-panel-2 font-medium text-white' : 'text-muted hover:bg-panel hover:text-white'}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      {children}
    </NavLink>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="md:space-y-1">
      <p className="hidden px-2.5 pb-1 text-xs font-semibold text-white md:block">{title}</p>
      <div className="flex gap-1 md:flex-col">{children}</div>
    </div>
  )
}

export function Header() {
  const { user, logout } = useAuth()
  return (
    <aside aria-label="Sidebar"
      className="sticky top-0 z-40 flex items-center gap-4 overflow-x-auto border-b border-line bg-base px-4 py-3 md:h-screen md:w-64 md:shrink-0 md:flex-col md:items-stretch md:gap-0 md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-4">
      <div className="flex shrink-0 items-center gap-2.5 md:px-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-black">
          <CarFront aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <span className="font-semibold tracking-tight">AutoVault</span>
      </div>

      <nav aria-label="Main" className="flex gap-1 md:mt-8 md:flex-col md:gap-6">
        <Section title="Shop">
          <NavItem to="/" end icon={Warehouse}>Inventory</NavItem>
          <NavItem to="/orders" icon={Receipt}>My orders</NavItem>
        </Section>
        {user?.is_admin && (
          <Section title="Admin">
            <NavItem to="/sales" icon={BarChart3}>Sales</NavItem>
          </Section>
        )}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0 md:mt-auto md:rounded-xl md:border md:border-line md:bg-panel md:p-3">
        <div className="hidden min-w-0 grow md:block">
          <p className="truncate text-sm font-medium text-white">{user?.email}</p>
          <p className="text-xs text-muted">{user?.is_admin ? 'Administrator' : 'Customer'}</p>
        </div>
        <button type="button" onClick={logout} aria-label="Log out" title="Log out"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-panel-2 hover:text-white">
          <LogOut aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
