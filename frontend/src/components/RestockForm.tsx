import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorMessage } from './ErrorMessage'
import { FormActions } from './FormActions'
import { FormField } from './FormField'
import { usePendingSubmit } from './usePendingSubmit'

export function RestockForm({ onSubmit, onCancel }: {
  onSubmit: (units: number) => Promise<void>
  onCancel: () => void
}) {
  const [units, setUnits] = useState('')
  const { pending, error, setError, run } = usePendingSubmit()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const amount = Number(units)
    if (units.trim() === '' || !Number.isInteger(amount) || amount < 1) {
      setError('Enter a whole number of at least 1.')
      return
    }
    void run(() => onSubmit(amount))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Units to add" type="number" min={1} step={1} autoFocus
        value={units} onChange={(e) => setUnits(e.target.value)} />
      <ErrorMessage message={error} />
      <FormActions pending={pending} label="Restock" pendingLabel="Restocking…" onCancel={onCancel} />
    </form>
  )
}
