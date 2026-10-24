import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApiError } from '../api/client'
import type { Order, Vehicle } from '../api/types'
import { checkoutApi } from '../api/checkout'
import { vehiclesApi } from '../api/vehicles'
import { useAuth } from '../auth/useAuth'
import { admin, alice, authState } from '../test/authMock'
import { checkoutOptions } from '../test/checkoutFixtures'
import { DashboardPage } from './DashboardPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../api/vehicles', () => ({
  vehiclesApi: { list: vi.fn(), search: vi.fn(), purchase: vi.fn() },
}))
vi.mock('../api/checkout', () => ({ checkoutApi: { options: vi.fn() } }))

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

// --- search (F4) ---

const rav4: Vehicle = { id: 3, make: 'Toyota', model: 'RAV4', category: 'SUV', price: 32000, quantity: 3 }

function cardTitles() {
  return screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent)
}

test('searching shows only the matching vehicles', async () => {
  api.list.mockResolvedValue([camry, mustang, rav4])
  api.search.mockResolvedValue([camry, rav4])
  renderDashboard()
  await screen.findAllByRole('article')

  await userEvent.type(screen.getByLabelText(/make/i), 'Toyota')
  await userEvent.click(screen.getByRole('button', { name: /search/i }))

  expect(api.search).toHaveBeenCalledWith({ make: 'Toyota' })
  await waitFor(() => expect(cardTitles()).toEqual(['Toyota Camry', 'Toyota RAV4']))
  expect(screen.getByText(/2 results/i)).toBeInTheDocument()
})

test('offers every category from the inventory in the filter', async () => {
  api.list.mockResolvedValue([camry, mustang, rav4])
  renderDashboard()
  await screen.findAllByRole('article')

  const options = within(screen.getByLabelText(/category/i)).getAllByRole('option')
  expect(options.map((o) => o.textContent)).toEqual(['All categories', 'Coupe', 'SUV', 'Sedan'])
})

test('says so when nothing matches the search', async () => {
  api.list.mockResolvedValue([camry])
  api.search.mockResolvedValue([])
  renderDashboard()
  await screen.findByRole('article')

  await userEvent.type(screen.getByLabelText(/make/i), 'Ferrari')
  await userEvent.click(screen.getByRole('button', { name: /search/i }))

  expect(await screen.findByText(/no vehicles match your search/i)).toBeInTheDocument()
})

test('clearing the search shows the full inventory again', async () => {
  api.list.mockResolvedValue([camry, mustang])
  api.search.mockResolvedValue([camry])
  renderDashboard()
  await screen.findAllByRole('article')
  await userEvent.type(screen.getByLabelText(/make/i), 'Toyota')
  await userEvent.click(screen.getByRole('button', { name: /search/i }))
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))

  await userEvent.click(screen.getByRole('button', { name: /clear/i }))

  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
})

test('shows an error when the search fails', async () => {
  api.list.mockResolvedValue([camry])
  api.search.mockRejectedValue(new ApiError(422, 'min_price: Input should be greater than or equal to 0'))
  renderDashboard()
  await screen.findByRole('article')

  await userEvent.click(screen.getByRole('button', { name: /search/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('min_price')
})


// --- purchase through checkout (F5) ---

const camryOrder: Order = {
  id: 7, vehicle_id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', image_url: null,
  base_price: 25000, color: 'arctic_white', package: 'standard', addons: [], delivery: 'pickup',
  line_items: [{ label: 'Toyota Camry (base price)', price: 25000 }],
  total_price: 25000, created_at: '2026-10-24T10:00:00Z',
}

async function checkOut(card: HTMLElement) {
  const user = userEvent.setup()
  await user.click(within(card).getByRole('button', { name: /purchase/i }))
  const dialog = await screen.findByRole('dialog', { name: /buy toyota camry/i })
  await user.click(await within(dialog).findByRole('button', { name: /confirm purchase/i }))
  return { dialog, user }
}

test('Purchase opens checkout; confirming buys the car and updates its stock', async () => {
  api.list.mockResolvedValue([camry])
  vi.mocked(checkoutApi.options).mockResolvedValue(checkoutOptions)
  api.purchase.mockResolvedValue({ vehicle: { ...camry, quantity: 4 }, order: camryOrder })
  renderDashboard()
  const card = await screen.findByRole('article')

  const { dialog, user } = await checkOut(card)

  expect(api.purchase).toHaveBeenCalledWith(camry.id, {
    color: 'arctic_white', package: 'standard', addons: [], delivery: 'pickup',
  })
  expect(await within(dialog).findByText(/order #7 confirmed/i)).toBeInTheDocument()
  expect(within(card).getByText('4 in stock')).toBeInTheDocument()
  expect(screen.getByText('1 models · 4 units in stock')).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: /done/i }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('You bought a Toyota Camry')
})

test('cancelling checkout buys nothing', async () => {
  api.list.mockResolvedValue([camry])
  vi.mocked(checkoutApi.options).mockResolvedValue(checkoutOptions)
  renderDashboard()
  const card = await screen.findByRole('article')
  const user = userEvent.setup()

  await user.click(within(card).getByRole('button', { name: /purchase/i }))
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /cancel/i }))

  expect(api.purchase).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('buying the last unit disables the Purchase button', async () => {
  api.list.mockResolvedValue([{ ...camry, quantity: 1 }])
  vi.mocked(checkoutApi.options).mockResolvedValue(checkoutOptions)
  api.purchase.mockResolvedValue({ vehicle: { ...camry, quantity: 0 }, order: camryOrder })
  renderDashboard()
  const card = await screen.findByRole('article')

  await checkOut(card)

  expect(await within(card).findByText('Out of stock')).toBeInTheDocument()
  expect(within(card).getByRole('button', { name: /purchase/i })).toBeDisabled()
})

test('a failed purchase shows the reason in checkout and marks the vehicle sold out', async () => {
  // e.g. someone else bought the last one after this page loaded
  api.list.mockResolvedValue([{ ...camry, quantity: 1 }])
  vi.mocked(checkoutApi.options).mockResolvedValue(checkoutOptions)
  api.purchase.mockRejectedValue(new ApiError(409, 'Vehicle is out of stock'))
  renderDashboard()
  const card = await screen.findByRole('article')

  const { dialog } = await checkOut(card)

  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Vehicle is out of stock')
  expect(within(card).getByRole('button', { name: /purchase/i })).toBeDisabled()
})