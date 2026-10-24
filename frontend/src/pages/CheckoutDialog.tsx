// Loads the option catalog and shows checkout for one vehicle in a dialog.
import { useEffect, useState } from 'react'
import { checkoutApi } from '../api/checkout'
import { errorText } from '../api/errorText'
import type { CheckoutOptions, CheckoutSelection, Order, Vehicle } from '../api/types'
import { CheckoutForm } from '../components/CheckoutForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { Modal } from '../components/Modal'

export function CheckoutDialog({ vehicle, onConfirm, onClose }: {
  vehicle: Vehicle
  onConfirm: (selection: CheckoutSelection) => Promise<Order>
  onClose: () => void
}) {
  const [options, setOptions] = useState<CheckoutOptions | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    checkoutApi
      .options()
      .then(setOptions)
      .catch((err: unknown) => setLoadError(errorText(err)))
  }, [])

  return (
    <Modal title={`Buy ${vehicle.make} ${vehicle.model}`} onClose={onClose}>
      {loadError ? (
        <ErrorMessage message={loadError} />
      ) : (
        <CheckoutForm vehicle={vehicle} options={options} onConfirm={onConfirm} onClose={onClose} />
      )}
    </Modal>
  )
}
