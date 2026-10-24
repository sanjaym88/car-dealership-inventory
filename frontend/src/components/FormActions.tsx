// Cancel + primary button row shared by the dialog forms.
import { buttonClass } from './buttonStyles'

export function FormActions({ pending, label, pendingLabel, onCancel, tone = 'primary' }: {
  pending: boolean
  label: string
  pendingLabel: string
  onCancel: () => void
  tone?: 'primary' | 'danger'
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className={buttonClass({ variant: 'ghost' })}>
        Cancel
      </button>
      <button type="submit" disabled={pending} aria-busy={pending}
        className={buttonClass({ variant: tone === 'danger' ? 'danger' : 'solid' })}>
        {pending ? pendingLabel : label}
      </button>
    </div>
  )
}
