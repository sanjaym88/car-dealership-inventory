// Cancel + primary button row shared by the dialog forms.
export function FormActions({ pending, label, pendingLabel, onCancel, tone = 'primary' }: {
  pending: boolean
  label: string
  pendingLabel: string
  onCancel: () => void
  tone?: 'primary' | 'danger'
}) {
  const color = tone === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" onClick={onCancel}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
        Cancel
      </button>
      <button type="submit" disabled={pending}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60 ${color}`}>
        {pending ? pendingLabel : label}
      </button>
    </div>
  )
}
