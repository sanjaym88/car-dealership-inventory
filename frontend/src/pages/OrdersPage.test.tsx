import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/orders'
import { useAuth } from '../auth/useAuth'
import { alice, authState } from '../test/authMock'
import { camryOrder, civicOrder } from '../test/orderFixtures'
import { OrdersPage } from './OrdersPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../api/orders', () => ({ ordersApi: { mine: vi.fn(), all: vi.fn() } }))

const api = vi.mocked(ordersApi)

function renderPage() {
  render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.mocked(useAuth).mockReturnValue(authState({ user: alice })))
afterEach(() => vi.resetAllMocks())

test('lists my orders with date, receipt and total', async () => {
  api.mine.mockResolvedValue([camryOrder, civicOrder])
  renderPage()

  expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  const orders = await screen.findAllByRole('article')
  expect(orders).toHaveLength(2)
  const camry = orders[0]
  expect(within(camry).getByRole('heading')).toHaveTextContent('Toyota Camry')
  expect(camry).toHaveTextContent('Order #7')
  expect(camry).toHaveTextContent('Oct 24, 2026')
  expect(camry).toHaveTextContent('Paint: Racing Red')
  expect(camry).toHaveTextContent('$29,550')
})

test('shows a summary of what I have spent', async () => {
  api.mine.mockResolvedValue([camryOrder, civicOrder])
  renderPage()

  expect(await screen.findByText('2 orders · $54,200 total')).toBeInTheDocument()
})

test('invites me to browse when I have no orders', async () => {
  api.mine.mockResolvedValue([])
  renderPage()

  expect(await screen.findByText(/haven't bought anything yet/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /browse the inventory/i })).toHaveAttribute('href', '/')
})

test('shows an error when orders cannot be loaded', async () => {
  api.mine.mockRejectedValue(new ApiError(500, 'Server unavailable'))
  renderPage()

  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable')
})
