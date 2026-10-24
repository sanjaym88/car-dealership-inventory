// Centered card used by the login and register pages.
import type { ReactNode } from 'react'

export function AuthLayout({ title, subtitle, children }: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-4xl" aria-hidden="true">🚗</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">AutoVault</h1>
          <p className="text-sm text-slate-300">Car dealership inventory</p>
        </div>
        <section className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>
          {children}
        </section>
      </div>
    </main>
  )
}
