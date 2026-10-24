import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { errorText } from '../api/errorText'
import { ErrorMessage } from '../components/ErrorMessage'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { useAuth } from '../auth/useAuth'

const MIN_PASSWORD_LENGTH = 8 // matches the backend rule

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Check what we can locally first, so obvious mistakes don't need a server round trip.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await register(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorText(err))
      setSubmitting(false)
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
      <p className="mt-1 mb-6 text-sm text-muted">Browse and buy from our inventory.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField label="Password" type="password" autoComplete="new-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <ErrorMessage message={error} />
        <SubmitButton pending={submitting} label="Create account" pendingLabel="Creating account…" />
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-medium text-accent transition-colors hover:text-accent-strong hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
