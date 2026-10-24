// Welcome page. Night-driving clips fill the screen; choosing Log in or Sign up slides the
// scene aside and rolls a garage door up to reveal the form.
import { Link, Navigate, NavLink, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import nightDrive1 from '../assets/hero/night-drive-1.gif'
import nightDrive2 from '../assets/hero/night-drive-2.gif'
import nightDrive3 from '../assets/hero/night-drive-3.gif'
import { HeroSlideshow } from '../components/HeroSlideshow'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { buttonClass } from '../components/buttonStyles'

export type Panel = 'login' | 'register'

// Durations are one play of each GIF (the sum of its frame delays), so each clip plays once.
const HERO_CLIPS = [
  { src: nightDrive1, duration: 2400 },
  { src: nightDrive2, duration: 1740 },
  { src: nightDrive3, duration: 1950 },
]

function GarageDoor() {
  return (
    <div data-testid="garage-door" aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 animate-garage-door bg-[repeating-linear-gradient(180deg,#e2e8f0_0_26px,#94a3b8_26px_28px,#cbd5e1_28px_30px)] shadow-[inset_0_-12px_24px_rgba(15,23,42,0.25)]">
      <div className="absolute bottom-6 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-slate-500" />
    </div>
  )
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-300 ease-glide sm:px-4 sm:py-2 ${
    isActive ? 'bg-white text-neutral-950' : 'text-white hover:bg-neutral-800'}`

export function LandingPage({ panel }: { panel?: Panel }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <Navigate to="/" replace />

  const open = panel !== undefined
  // Keep "where to go after login" (set by ProtectedRoute) while switching between forms.
  const state = location.state

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/welcome" className="whitespace-nowrap text-lg font-bold tracking-tight">
            AutoVault
          </Link>
          <nav aria-label="Account" className="flex gap-1 rounded-full bg-neutral-950 p-1 ring-1 ring-neutral-700">
            <NavLink to="/login" state={state} className={navLink}>Log in</NavLink>
            <NavLink to="/register" state={state} className={navLink}>Sign up</NavLink>
          </nav>
        </div>
      </header>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className={`relative flex shrink-0 items-center transition-[flex-basis,min-height] duration-700 ease-silk ${
          open ? 'min-h-[42vh] lg:min-h-screen lg:basis-[56%]' : 'min-h-screen lg:basis-full'}`}>
          <HeroSlideshow slides={HERO_CLIPS} />
          <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-32 pt-24 text-center lg:pb-40">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl">
              AutoVault
            </h1>
            <p className="mt-4 text-lg text-white sm:text-2xl">
              Your next dream car.
            </p>
            {!open && (
              <div className="mt-8 flex flex-wrap justify-center gap-4">
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
            className="relative flex flex-1 items-center justify-center bg-base text-white lg:min-h-screen">
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
