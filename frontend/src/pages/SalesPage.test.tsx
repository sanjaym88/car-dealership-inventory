import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/orders'
import { useAuth } from '../auth/useAuth'
import { admin, authState } from '../test/authMock'
import { sales } from '../test/orderFixtures'
import { SalesPage } from './SalesPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../api/orders', () => ({ ordersApi: { mine: vi.fn(), all: vi.fn() } }))

const api = vi.mocked(ordersApi)

function renderPage() {
  render(
    <MemoryRouter>
      <SalesPage />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.mocked(useAuth).mockReturnValue(authState({ user: admin })))
afterEach(() => vi.resetAllMocks())

test('lists every sale with order number, date, buyer, vehicle and total', async () => {
  api.all.mockResolvedValue(sales)
  renderPage()

  const table = await screen.findByRole('table')
  const rows = within(table).getAllByRole('row').slice(1) // skip the header row
  expect(rows).toHaveLength(2)
  expect(rows[0]).toHaveTextContent('#7')
  expect(rows[0]).toHaveTextContent('Oct 24, 2026')
  expect(rows[0]).toHaveTextContent('alice@example.com')
  expect(rows[0]).toHaveTextContent('Toyota Camry')
  expect(rows[0]).toHaveTextContent('$29,550')
})

test('summarises orders and revenue', async () => {
  api.all.mockResolvedValue(sales)
  renderPage()

  expect(await screen.findByText('2 orders')).toBeInTheDocument()
  expect(screen.getByText('$54,200')).toBeInTheDocument()
})

test('says so when nothing has been sold yet', async () => {
  api.all.mockResolvedValue([])
  renderPage()

  expect(await screen.findByText(/no sales yet/i)).toBeInTheDocument()
})

test('shows an error when sales cannot be loaded', async () => {
  api.all.mockRejectedValue(new ApiError(403, 'Admin privileges required'))
  renderPage()

  expect(await screen.findByRole('alert')).toHaveTextContent('Admin privileges required')
})
