import { useCallback, useState } from 'react'
import type { Vehicle } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ErrorMessage } from '../components/ErrorMessage'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { VehicleCard } from '../components/VehicleCard'
import { AdminDialogs } from './AdminDialogs'
import type { AdminDialog } from './AdminDialogs'
import { CheckoutDialog } from './CheckoutDialog'
import { useInventory } from './useInventory'

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
            {inv.inventory && inv.inventory.length > 0 && (
              <p className="text-sm text-slate-500">
                {inv.inventory.length} models · {inv.unitsInStock} units in stock
              </p>
            )}
          </div>
          {user?.is_admin && (
            <button type="button" onClick={() => setDialog({ kind: 'add' })}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500">
              + Add vehicle
            </button>
          )}
        </div>

        <SearchBar categories={inv.categories} onSearch={inv.search} onClear={inv.clearSearch} />

        <ErrorMessage message={inv.error} />
        {inv.notice && (
          <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {inv.notice}
          </p>
        )}

        {inv.results === null && inv.error === null && (
          <p role="status" className="py-16 text-center text-slate-500">Loading vehicles…</p>
        )}

        {inv.searching && inv.results && (
          <p className="mb-4 text-sm text-slate-500">
            {inv.results.length} {inv.results.length === 1 ? 'result' : 'results'}
          </p>
        )}

        {inv.results?.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
            {inv.searching ? 'No vehicles match your search.' : 'No vehicles yet. Check back soon!'}
          </p>
        )}

        {inv.results && inv.results.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inv.results.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={setBuying}
                purchasing={inv.purchasingId === vehicle.id} admin={adminActions} />
            ))}
          </div>
        )}
      </main>

      <AdminDialogs dialog={dialog} onClose={closeDialog} actions={inv} />
      {buying && (
        <CheckoutDialog vehicle={buying} onClose={closeCheckout}
          onConfirm={(selection) => inv.purchase(buying, selection)} />
      )}
    </div>
  )
}
