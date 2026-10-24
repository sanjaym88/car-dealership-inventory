import { useCallback, useState } from 'react'
import type { Vehicle } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { ErrorMessage } from '../components/ErrorMessage'
import { Header } from '../components/Header'
import { Modal } from '../components/Modal'
import { RestockForm } from '../components/RestockForm'
import { SearchBar } from '../components/SearchBar'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleForm } from '../components/VehicleForm'
import { useInventory } from './useInventory'

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit' | 'restock' | 'delete'; vehicle: Vehicle }
  | null

export function DashboardPage() {
  const { user } = useAuth()
  const inv = useInventory()
  const [dialog, setDialog] = useState<Dialog>(null)
  const closeDialog = useCallback(() => setDialog(null), [])

  // Runs an admin action, then closes the dialog. Errors propagate so the form can show them.
  const andClose = (action: () => Promise<void>) => async () => {
    await action()
    closeDialog()
  }

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
              <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={inv.purchase}
                purchasing={inv.purchasingId === vehicle.id} admin={adminActions} />
            ))}
          </div>
        )}
      </main>

      {dialog?.kind === 'add' && (
        <Modal title="Add vehicle" onClose={closeDialog}>
          <VehicleForm submitLabel="Add vehicle" onCancel={closeDialog}
            onSubmit={(data) => andClose(() => inv.createVehicle(data))()} />
        </Modal>
      )}
      {dialog?.kind === 'edit' && (
        <Modal title={`Edit ${dialog.vehicle.make} ${dialog.vehicle.model}`} onClose={closeDialog}>
          <VehicleForm initial={dialog.vehicle} submitLabel="Save changes" onCancel={closeDialog}
            onSubmit={(data) => andClose(() => inv.updateVehicle(dialog.vehicle.id, data))()} />
        </Modal>
      )}
      {dialog?.kind === 'restock' && (
        <Modal title={`Restock ${dialog.vehicle.make} ${dialog.vehicle.model}`} onClose={closeDialog}>
          <RestockForm onCancel={closeDialog}
            onSubmit={(units) => andClose(() => inv.restockVehicle(dialog.vehicle, units))()} />
        </Modal>
      )}
      {dialog?.kind === 'delete' && (
        <Modal title={`Delete ${dialog.vehicle.make} ${dialog.vehicle.model}?`} onClose={closeDialog}>
          <ConfirmDelete name={`${dialog.vehicle.make} ${dialog.vehicle.model}`} onCancel={closeDialog}
            onConfirm={andClose(() => inv.deleteVehicle(dialog.vehicle))} />
        </Modal>
      )}
    </div>
  )
}
