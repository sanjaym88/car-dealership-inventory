import { useCallback, useState } from 'react'
import type { Vehicle } from '../api/types'
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
    <button type="button" onClick={() => setDialog({ kind: 'add' })}
      className={buttonClass({ variant: 'light' })}>
      + Add vehicle
    </button>
  )

  return (
    <PageShell title="Inventory" subtitle={summary} actions={addButton}>
      <SearchBar categories={inv.categories} onSearch={inv.search} onClear={inv.clearSearch} />

      <ErrorMessage message={inv.error} />
      {inv.notice && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {inv.notice}
        </p>
      )}

      {inv.results === null && inv.error === null && (
        <p role="status" className="py-16 text-center text-neutral-200">Loading vehicles…</p>
      )}

      {inv.searching && inv.results && (
        <p className="mb-4 text-sm text-neutral-200">
          {inv.results.length} {inv.results.length === 1 ? 'result' : 'results'}
        </p>
      )}

      {inv.results?.length === 0 && (
        <p className="rounded-2xl border border-neutral-800 bg-neutral-900 py-16 text-center text-neutral-200">
          {inv.searching ? 'No vehicles match your search.' : 'No vehicles yet. Check back soon!'}
        </p>
      )}

      {inv.results && inv.results.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {inv.results.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={setBuying}
              purchasing={inv.purchasingId === vehicle.id} admin={adminActions} />
          ))}
        </div>
      )}

      <AdminDialogs dialog={dialog} onClose={closeDialog} actions={inv} />
      {buying && (
        <CheckoutDialog vehicle={buying} onClose={closeCheckout}
          onConfirm={(selection) => inv.purchase(buying, selection)} />
      )}
    </PageShell>
  )
}
