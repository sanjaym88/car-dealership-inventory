// Full-width primary form button that shows a different label and disables itself while pending.
import { buttonClass } from './buttonStyles'

export function SubmitButton({ pending, label, pendingLabel }: {
  pending: boolean
  label: string
  pendingLabel: string
}) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending}
      className={buttonClass({ variant: 'solid', size: 'lg', block: true })}>
      {pending && (
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {pending ? pendingLabel : label}
    </button>
  )
}
