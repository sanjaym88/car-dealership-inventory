// App frame in the style of Watermelon UI: sidebar on the left, a slim top bar with a
// breadcrumb, then the page title (with optional subtitle and actions) and content.
import type { ReactNode } from 'react'
import { Header } from './Header'

export function PageShell({ title, subtitle, actions, children }: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-base text-white md:flex">
      <Header />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-line bg-base px-8 md:flex">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            <span className="text-muted">AutoVault</span>
            <span aria-hidden="true" className="text-line">/</span>
            <span className="font-medium text-white">{title}</span>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
