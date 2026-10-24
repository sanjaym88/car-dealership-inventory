import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { alice, authState } from '../test/authMock'
import { LandingPage } from './LandingPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage panel="login" />} />
        <Route path="/register" element={<LandingPage panel="register" />} />
        <Route path="/" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => mockedUseAuth.mockReturnValue(authState()))
afterEach(() => vi.resetAllMocks())

test('greets visitors with the brand, tagline and driving clips', () => {
  renderAt('/welcome')

  expect(screen.getByRole('heading', { level: 1, name: 'AutoVault' })).toBeInTheDocument()
  expect(screen.getByText(/your next dream car/i)).toBeInTheDocument()
  expect(screen.getByTestId('hero-slideshow')).toBeInTheDocument()
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
})

test('the top bar offers log in and sign up', async () => {
  renderAt('/welcome')
  const nav = screen.getByRole('navigation')

  await userEvent.click(within(nav).getByRole('link', { name: 'Log in' }))

  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
})

test('sign up opens the registration form', async () => {
  renderAt('/welcome')

  await userEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Sign up' }))

  expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
})

test('the call to action leads to sign up', () => {
  renderAt('/welcome')

  expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register')
})

test('the form is revealed behind a garage door', () => {
  renderAt('/login')

  const panel = screen.getByRole('region', { name: /log in/i })
  expect(within(panel).getByTestId('garage-door')).toBeInTheDocument()
  expect(within(panel).getByLabelText(/email/i)).toBeInTheDocument()
})

test('logged-in visitors go straight to the inventory', () => {
  mockedUseAuth.mockReturnValue(authState({ user: alice }))
  renderAt('/welcome')

  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
