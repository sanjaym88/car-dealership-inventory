import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { useAuth } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('./AuthContext', () => ({ useAuth: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)

function authState(user: { id: number; email: string; is_admin: boolean } | null, loading = false) {
  return { user, loading, login: vi.fn(), register: vi.fn(), logout: vi.fn() }
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<p>Dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('redirects anonymous visitors to /login', () => {
  mockedUseAuth.mockReturnValue(authState(null))

  renderAt('/')

  expect(screen.getByText('Login page')).toBeInTheDocument()
})

test('shows the page to logged-in users', () => {
  mockedUseAuth.mockReturnValue(authState({ id: 1, email: 'a@b.com', is_admin: false }))

  renderAt('/')

  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})

test('waits while the session is being restored instead of redirecting', () => {
  mockedUseAuth.mockReturnValue(authState(null, true))

  renderAt('/')

  expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toBeInTheDocument()
})
