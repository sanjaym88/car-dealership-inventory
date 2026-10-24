import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Vehicle, VehicleSearchParams } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ErrorMessage } from '../components/ErrorMessage'
import { PageShell } from '../components/PageShell'
import { SearchBar } from '../components/SearchBar'
import { VehicleCard } from '../components/VehicleCard'
import { AdminDialogs } from './AdminDialogs'
import type { AdminDialog } from './AdminDialogs'
import { CheckoutDialog } from './CheckoutDialog'
import { useInventory } from './useInventory'
import { buttonClass } from '../components/buttonStyles'

export function DashboardPage() {
  const { user } = useAuth()
  const inv = useInventory()
  const [dialog, setDialog] = useState<AdminDialog>(null)
  const closeDialog = useCallback(() => setDialog(null), [])
  // The vehicle being checked out, if the checkout dialog is open.
  const [buying, setBuying] = useState<Vehicle | null>(null)
  const closeCheckout = useCallback(() => setBuying(null), [])

  const adminActions = user?.is_admin
    ? {
        onEdit: (vehicle: Vehicle) => setDialog({ kind: 'edit', vehicle }),
        onRestock: (vehicle: Vehicle) => setDialog({ kind: 'restock', vehicle }),
        onDelete: (vehicle: Vehicle) => setDialog({ kind: 'delete', vehicle }),
      }
    : undefined

  const summary = inv.inventory && inv.inventory.length > 0
    ? `${inv.inventory.length} models · ${inv.unitsInStock} units in stock`
    : undefined
  const addButton = user?.is_admin && (
    <button type="button" onClick={() => setDialog({ kind: 'add' })} className={buttonClass({ variant: 'solid' })}>
      <Plus aria-hidden="true" className="h-4 w-4" />
      Add vehicle
    </button>
  )

  // Quick category tabs above the grid; the filter panel can also set the category.
  const [tab, setTab] = useState('All')
  function selectTab(category: string) {
    setTab(category)
    if (category === 'All') inv.clearSearch()
    else inv.search({ category })
  }
  function searchFromFilters(params: VehicleSearchParams) {
    setTab(params.category ?? 'All')
    inv.search(params)
  }
  function showAll() {
    setTab('All')
    inv.clearSearch()
  }

  return (
    <PageShell title="Inventory" subtitle={summary} actions={addButton}>
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <SearchBar categories={inv.categories} onSearch={searchFromFilters} onClear={showAll} />
        </div>

        <div className="min-w-0 space-y-5">
          <div role="tablist" aria-label="Categories"
            className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1 [scrollbar-width:none]">
            {['All', ...inv.categories].map((category) => (
              <button key={category} type="button" role="tab" aria-selected={tab === category}
                onClick={() => selectTab(category)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  tab === category ? 'bg-accent text-black' : 'text-muted hover:bg-panel-2 hover:text-white'}`}>
                {category}
              </button>
            ))}
          </div>

          <ErrorMessage message={inv.error} />
          {inv.notice && (
            <p role="status" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent ring-1 ring-inset ring-accent/30">
              {inv.notice}
            </p>
          )}

          {inv.results === null && inv.error === null && (
            <p role="status" className="py-16 text-center text-muted">Loading vehicles…</p>
          )}

          {inv.searching && inv.results && (
            <p className="text-sm text-muted">
              {inv.results.length} {inv.results.length === 1 ? 'result' : 'results'}
            </p>
          )}

          {inv.results?.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">
              {inv.searching ? 'No vehicles match your search.' : 'No vehicles yet. Check back soon!'}
            </p>
          )}

          {inv.results && inv.results.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {inv.results.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={setBuying}
                  purchasing={inv.purchasingId === vehicle.id} admin={adminActions} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminDialogs dialog={dialog} onClose={closeDialog} actions={inv} />
      {buying && (
        <CheckoutDialog vehicle={buying} onClose={closeCheckout}
          onConfirm={(selection) => inv.purchase(buying, selection)} />
      )}
    </PageShell>
  )
}
