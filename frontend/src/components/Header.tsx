import { useAuth } from '../auth/useAuth'

export function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <p className="text-lg font-bold tracking-tight">
          <span aria-hidden="true">🚗 </span>AutoVault
        </p>
        <div className="flex items-center gap-3 text-sm">
          {user?.is_admin && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-900">
              Admin
            </span>
          )}
          <span className="hidden text-slate-300 sm:inline">{user?.email}</span>
          <button type="button" onClick={logout}
            className="rounded-lg bg-white/10 px-3 py-1.5 font-medium transition hover:bg-white/20">
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
