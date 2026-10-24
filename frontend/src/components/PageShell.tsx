// Common page frame: header, centered content and a title with an optional subtitle and actions.
import type { ReactNode } from 'react'
import { Header } from './Header'
import { NightBackdrop } from './NightBackdrop'

export function PageShell({ title, subtitle, actions, children }: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <NightBackdrop />
      <Header />
      <main className="mx-auto max-w-6xl animate-fade-up px-4 pb-24 pt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  )
}
