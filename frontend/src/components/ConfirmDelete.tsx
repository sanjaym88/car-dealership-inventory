import type { FormEvent } from 'react'
import { ErrorMessage } from './ErrorMessage'
import { FormActions } from './FormActions'
import { usePendingSubmit } from './usePendingSubmit'

export function ConfirmDelete({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  const { pending, error, run } = usePendingSubmit()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void run(onConfirm)
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600">
        This permanently removes <strong className="text-slate-900">{name}</strong> from the inventory.
      </p>
      <div className="mt-4"><ErrorMessage message={error} /></div>
      <FormActions pending={pending} label="Delete" pendingLabel="Deleting…" onCancel={onCancel} tone="danger" />
    </form>
  )
}
