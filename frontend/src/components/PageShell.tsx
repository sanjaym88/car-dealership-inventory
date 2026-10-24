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
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-neutral-300">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  )
}
