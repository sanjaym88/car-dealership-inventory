import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApiError } from '../api/client'
import type { Vehicle } from '../api/types'
import { vehiclesApi } from '../api/vehicles'
import { useAuth } from '../auth/useAuth'
import { admin, alice, authState } from '../test/authMock'
import { DashboardPage } from './DashboardPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../api/vehicles', () => ({ vehiclesApi: { list: vi.fn() } }))

const mockedUseAuth = vi.mocked(useAuth)
const api = vi.mocked(vehiclesApi)

const camry: Vehicle = { id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 }
const mustang: Vehicle = { id: 2, make: 'Ford', model: 'Mustang', category: 'Coupe', price: 45999.5, quantity: 0 }

function renderDashboard() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

beforeEach(() => mockedUseAuth.mockReturnValue(authState({ user: alice })))
afterEach(() => vi.resetAllMocks())

test('shows a loading indicator, then one card per vehicle', async () => {
  api.list.mockResolvedValue([camry, mustang])
  renderDashboard()

  expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  const cards = await screen.findAllByRole('article')
  expect(cards).toHaveLength(2)
  expect(within(cards[0]).getByRole('heading')).toHaveTextContent('Toyota Camry')
})

test('shows category, formatted price and stock on each card', async () => {
  api.list.mockResolvedValue([camry])
  renderDashboard()

  const card = await screen.findByRole('article')
  expect(card).toHaveTextContent('Sedan')
  expect(card).toHaveTextContent('$25,000')
  expect(card).toHaveTextContent('5 in stock')
})

test('marks sold-out vehicles as out of stock', async () => {
  api.list.mockResolvedValue([mustang])
  renderDashboard()

  const card = await screen.findByRole('article')
  expect(card).toHaveTextContent('Out of stock')
  expect(card).toHaveTextContent('$45,999.50')
})

test('shows a friendly message when the inventory is empty', async () => {
  api.list.mockResolvedValue([])
  renderDashboard()

  expect(await screen.findByText(/no vehicles yet/i)).toBeInTheDocument()
})

test('shows an error when the vehicles cannot be loaded', async () => {
  api.list.mockRejectedValue(new ApiError(500, 'Server unavailable'))
  renderDashboard()

  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable')
})

test('shows a summary of models and units in stock', async () => {
  api.list.mockResolvedValue([camry, mustang])
  renderDashboard()

  expect(await screen.findByText('2 models · 5 units in stock')).toBeInTheDocument()
})

test('header shows the user and logs out', async () => {
  const state = authState({ user: alice })
  mockedUseAuth.mockReturnValue(state)
  api.list.mockResolvedValue([])
  renderDashboard()

  expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /log out/i }))
  expect(state.logout).toHaveBeenCalled()
})

test('header shows an Admin badge for admins', async () => {
  mockedUseAuth.mockReturnValue(authState({ user: admin }))
  api.list.mockResolvedValue([])
  renderDashboard()

  expect(screen.getByText('Admin')).toBeInTheDocument()
  await screen.findByText(/no vehicles yet/i)
})
