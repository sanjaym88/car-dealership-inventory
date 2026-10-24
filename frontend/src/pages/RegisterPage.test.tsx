import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { authState } from '../test/authMock'
import { RegisterPage } from './RegisterPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

function renderRegister() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string, confirm: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/^password/i), password)
  await user.type(screen.getByLabelText(/confirm password/i), confirm)
  await user.click(screen.getByRole('button', { name: /create account/i }))
}

test('registers and opens the dashboard', async () => {
  const state = authState()
  mockedUseAuth.mockReturnValue(state)
  renderRegister()

  await fillAndSubmit('alice@example.com', 'secret123', 'secret123')

  expect(state.register).toHaveBeenCalledWith('alice@example.com', 'secret123')
  expect(await screen.findByText('Dashboard')).toBeInTheDocument()
})

test('rejects mismatched passwords without calling the server', async () => {
  const state = authState()
  mockedUseAuth.mockReturnValue(state)
  renderRegister()

  await fillAndSubmit('alice@example.com', 'secret123', 'secret124')

  expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
  expect(state.register).not.toHaveBeenCalled()
})

test('rejects passwords shorter than 8 characters without calling the server', async () => {
  const state = authState()
  mockedUseAuth.mockReturnValue(state)
  renderRegister()

  await fillAndSubmit('alice@example.com', 'short', 'short')

  expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters')
  expect(state.register).not.toHaveBeenCalled()
})

test('shows the server error, e.g. an email that is already taken', async () => {
  const register = vi.fn().mockRejectedValue(new ApiError(409, 'Email already registered'))
  mockedUseAuth.mockReturnValue(authState({ register }))
  renderRegister()

  await fillAndSubmit('alice@example.com', 'secret123', 'secret123')

  expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered')
})

test('links back to the login page', async () => {
  mockedUseAuth.mockReturnValue(authState())
  renderRegister()

  await userEvent.click(screen.getByRole('link', { name: /log in/i }))

  expect(screen.getByText('Login page')).toBeInTheDocument()
})
