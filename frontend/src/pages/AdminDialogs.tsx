// The admin dialogs (add, edit, restock, delete). Which one is open is controlled by the dashboard.
import type { Vehicle, VehicleInput } from '../api/types'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { Modal } from '../components/Modal'
import { RestockForm } from '../components/RestockForm'
import { VehicleForm } from '../components/VehicleForm'

export type AdminDialog =
  | { kind: 'add' }
  | { kind: 'edit' | 'restock' | 'delete'; vehicle: Vehicle }
  | null

export function AdminDialogs({ dialog, onClose, actions }: {
  dialog: AdminDialog
  onClose: () => void
  actions: {
    createVehicle: (data: VehicleInput) => Promise<void>
    updateVehicle: (id: number, data: VehicleInput) => Promise<void>
    restockVehicle: (vehicle: Vehicle, units: number) => Promise<void>
    deleteVehicle: (vehicle: Vehicle) => Promise<void>
  }
}) {
  if (dialog === null) return null

  // Close only after the action succeeds; on failure the error propagates to the open form.
  const thenClose = async (work: Promise<void>) => {
    await work
    onClose()
  }

  if (dialog.kind === 'add') {
    return (
      <Modal title="Add vehicle" onClose={onClose}>
        <VehicleForm submitLabel="Add vehicle" onCancel={onClose}
          onSubmit={(data) => thenClose(actions.createVehicle(data))} />
      </Modal>
    )
  }

  const { vehicle } = dialog
  const name = `${vehicle.make} ${vehicle.model}`

  if (dialog.kind === 'edit') {
    return (
      <Modal title={`Edit ${name}`} onClose={onClose}>
        <VehicleForm initial={vehicle} submitLabel="Save changes" onCancel={onClose}
          onSubmit={(data) => thenClose(actions.updateVehicle(vehicle.id, data))} />
      </Modal>
    )
  }

  if (dialog.kind === 'restock') {
    return (
      <Modal title={`Restock ${name}`} onClose={onClose}>
        <RestockForm onCancel={onClose}
          onSubmit={(units) => thenClose(actions.restockVehicle(vehicle, units))} />
      </Modal>
    )
  }

  return (
    <Modal title={`Delete ${name}?`} onClose={onClose}>
      <ConfirmDelete name={name} onCancel={onClose}
        onConfirm={() => thenClose(actions.deleteVehicle(vehicle))} />
    </Modal>
  )
}
