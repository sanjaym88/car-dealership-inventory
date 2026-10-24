// Full-width primary form button that shows a different label and disables itself while pending.
export function SubmitButton({ pending, label, pendingLabel }: {
  pending: boolean
  label: string
  pendingLabel: string
}) {
  return (
    <button type="submit" disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? pendingLabel : label}
    </button>
  )
}
