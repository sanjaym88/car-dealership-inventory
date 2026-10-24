import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { errorText } from '../api/errorText'
import { ErrorMessage } from '../components/ErrorMessage'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // After login, return to the page that sent the user here (set by ProtectedRoute).
  const destination = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  if (user) return <Navigate to={destination} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(errorText(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage the inventory.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField label="Password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorMessage message={error} />
        <SubmitButton pending={submitting} label="Log in" pendingLabel="Logging in…" />
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
