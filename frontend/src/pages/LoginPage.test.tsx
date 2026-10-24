import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { alice, authState } from '../test/authMock'
import { LoginPage } from './LoginPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<p>Register page</p>} />
        <Route path="/" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole('button', { name: /log in/i }))
}

test('logs in with the entered credentials and opens the dashboard', async () => {
  const state = authState()
  mockedUseAuth.mockReturnValue(state)
  renderLogin()

  await fillAndSubmit('alice@example.com', 'secret123')

  expect(state.login).toHaveBeenCalledWith('alice@example.com', 'secret123')
  expect(await screen.findByText('Dashboard')).toBeInTheDocument()
})

test('shows the server error and stays on the page when login fails', async () => {
  const login = vi.fn().mockRejectedValue(new ApiError(401, 'Invalid email or password'))
  mockedUseAuth.mockReturnValue(authState({ login }))
  renderLogin()

  await fillAndSubmit('alice@example.com', 'wrong-pass')

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
})

test('disables the button while logging in', async () => {
  const login = vi.fn().mockReturnValue(new Promise(() => {}))
  mockedUseAuth.mockReturnValue(authState({ login }))
  renderLogin()

  await fillAndSubmit('alice@example.com', 'secret123')

  expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
})

test('links to the registration page', async () => {
  mockedUseAuth.mockReturnValue(authState())
  renderLogin()

  await userEvent.click(screen.getByRole('link', { name: /create an account/i }))

  expect(screen.getByText('Register page')).toBeInTheDocument()
})

test('sends already logged-in users to the dashboard', () => {
  mockedUseAuth.mockReturnValue(authState({ user: alice }))
  renderLogin()

  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
