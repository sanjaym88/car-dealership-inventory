// Welcome page. The night-drive scene fills the screen; choosing Log in or Sign up slides the
// scene aside and rolls a garage door up to reveal the form.
import { Link, Navigate, NavLink, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { DriveScene } from '../components/DriveScene'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { buttonClass } from '../components/buttonStyles'

export type Panel = 'login' | 'register'

function GarageDoor() {
  return (
    <div data-testid="garage-door" aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 animate-garage-door bg-[repeating-linear-gradient(180deg,#e2e8f0_0_26px,#94a3b8_26px_28px,#cbd5e1_28px_30px)] shadow-[inset_0_-12px_24px_rgba(15,23,42,0.25)]">
      <div className="absolute bottom-6 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-slate-500" />
    </div>
  )
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition duration-300 sm:px-4 sm:py-2 ${
    isActive ? 'bg-white text-slate-900' : 'text-white/85 hover:bg-white/10 hover:text-white'}`

export function LandingPage({ panel }: { panel?: Panel }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <Navigate to="/" replace />

  const open = panel !== undefined
  // Keep "where to go after login" (set by ProtectedRoute) while switching between forms.
  const state = location.state

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060816] text-white">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/welcome" className="whitespace-nowrap text-lg font-bold tracking-tight">
            <span aria-hidden="true">🚗 </span>AutoVault
          </Link>
          <nav aria-label="Account" className="flex gap-1 rounded-full bg-slate-950/70 p-1 shadow-lg ring-1 ring-white/10 backdrop-blur">
            <NavLink to="/login" state={state} className={navLink}>Log in</NavLink>
            <NavLink to="/register" state={state} className={navLink}>Sign up</NavLink>
          </nav>
        </div>
      </header>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className={`relative flex shrink-0 items-center transition-[flex-basis,min-height] duration-700 ease-silk ${
          open ? 'min-h-[42vh] lg:min-h-screen lg:basis-[56%]' : 'min-h-screen lg:basis-full'}`}>
          <DriveScene />
          <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-32 pt-24 text-center lg:pb-40">
            <h1 className="animate-fade-up bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl">
              AutoVault
            </h1>
            <p className="mt-3 animate-fade-up text-lg text-slate-200 [animation-delay:120ms] sm:text-2xl">
              Your next dream car.
            </p>
            {!open && (
              <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:240ms]">
                <Link to="/register" state={state}
                  className={buttonClass({ variant: 'light', size: 'lg' })}>
                  Get started
                </Link>
                <Link to="/login" state={state}
                  className={buttonClass({ variant: 'outline', size: 'lg' })}>
                  I have an account
                </Link>
              </div>
            )}
          </div>
        </section>

        {open && (
          <section aria-label={panel === 'login' ? 'Log in' : 'Sign up'}
            className="relative flex flex-1 animate-panel-in items-center justify-center bg-slate-50 text-slate-900 lg:min-h-screen">
            {/* key: switching forms closes the door and rolls it up again */}
            <div key={panel} className="relative w-full max-w-md overflow-hidden px-6 py-12 sm:px-10">
              <GarageDoor />
              {panel === 'login' ? <LoginPage /> : <RegisterPage />}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
