// Runs an async submit, tracking "pending" and turning a thrown error into a message for the form.
import { useState } from 'react'
import { errorText } from '../api/errorText'

export function usePendingSubmit() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setError(null)
    setPending(true)
    try {
      await action()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setPending(false)
    }
  }

  return { pending, error, setError, run }
}
