// Admin-only inventory management on the dashboard: add, edit, restock and delete.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApiError } from '../api/client'
import type { Vehicle } from '../api/types'
import { vehiclesApi } from '../api/vehicles'
import { useAuth } from '../auth/useAuth'
import { admin, alice, authState } from '../test/authMock'
import { DashboardPage } from './DashboardPage'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../api/vehicles', () => ({
  vehiclesApi: {
    list: vi.fn(), search: vi.fn(), purchase: vi.fn(),
    create: vi.fn(), update: vi.fn(), remove: vi.fn(), restock: vi.fn(),
  },
}))

const mockedUseAuth = vi.mocked(useAuth)
const api = vi.mocked(vehiclesApi)
const camry: Vehicle = { id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 }

async function renderAs(user: typeof admin, vehicles: Vehicle[] = [camry]) {
  mockedUseAuth.mockReturnValue(authState({ user }))
  api.list.mockResolvedValue(vehicles)
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
  if (vehicles.length) await screen.findAllByRole('article')
  else await screen.findByText(/no vehicles yet/i)
}

function camryCard() {
  return screen.getByRole('article', { name: /toyota camry/i })
}

afterEach(() => vi.resetAllMocks())

test('regular users see no admin controls', async () => {
  await renderAs(alice)

  expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument()
  expect(within(camryCard()).queryByRole('button', { name: /edit|delete|restock/i })).not.toBeInTheDocument()
})

test('admin adds a vehicle and it appears in the inventory', async () => {
  const civic: Vehicle = { id: 9, make: 'Honda', model: 'Civic', category: 'Sedan', price: 23500, quantity: 8 }
  api.create.mockResolvedValue(civic)
  await renderAs(admin, [])
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /add vehicle/i }))
  const dialog = screen.getByRole('dialog', { name: /add vehicle/i })
  await user.type(within(dialog).getByLabelText(/^make/i), 'Honda')
  await user.type(within(dialog).getByLabelText(/^model/i), 'Civic')
  await user.type(within(dialog).getByLabelText(/^category/i), 'Sedan')
  await user.type(within(dialog).getByLabelText(/^price/i), '23500')
  await user.type(within(dialog).getByLabelText(/^quantity/i), '8')
  await user.click(within(dialog).getByRole('button', { name: /add vehicle/i }))

  expect(api.create).toHaveBeenCalledWith({
    make: 'Honda', model: 'Civic', category: 'Sedan', price: 23500, quantity: 8,
  })
  expect(await screen.findByRole('article', { name: /honda civic/i })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Added Honda Civic')
})

test('admin edits a vehicle and the card updates', async () => {
  api.update.mockResolvedValue({ ...camry, price: 23999 })
  await renderAs(admin)
  const user = userEvent.setup()

  await user.click(within(camryCard()).getByRole('button', { name: /edit/i }))
  const dialog = screen.getByRole('dialog', { name: /edit toyota camry/i })
  const price = within(dialog).getByLabelText(/^price/i)
  await user.clear(price)
  await user.type(price, '23999')
  await user.click(within(dialog).getByRole('button', { name: /save changes/i }))

  expect(api.update).toHaveBeenCalledWith(1, { ...camryWithoutId(), price: 23999 })
  await waitFor(() => expect(camryCard()).toHaveTextContent('$23,999'))
})

test('admin restocks a vehicle and the stock updates', async () => {
  api.restock.mockResolvedValue({ ...camry, quantity: 9 })
  await renderAs(admin)
  const user = userEvent.setup()

  await user.click(within(camryCard()).getByRole('button', { name: /restock/i }))
  const dialog = screen.getByRole('dialog', { name: /restock toyota camry/i })
  await user.type(within(dialog).getByLabelText(/units to add/i), '4')
  await user.click(within(dialog).getByRole('button', { name: /restock/i }))

  expect(api.restock).toHaveBeenCalledWith(1, 4)
  await waitFor(() => expect(camryCard()).toHaveTextContent('9 in stock'))
})

test('admin deletes a vehicle after confirming', async () => {
  api.remove.mockResolvedValue(undefined)
  await renderAs(admin)
  const user = userEvent.setup()

  await user.click(within(camryCard()).getByRole('button', { name: /delete/i }))
  const dialog = screen.getByRole('dialog', { name: /delete toyota camry/i })
  await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

  expect(api.remove).toHaveBeenCalledWith(1)
  await waitFor(() => expect(screen.queryByRole('article')).not.toBeInTheDocument())
})

test('cancelling the delete keeps the vehicle', async () => {
  await renderAs(admin)
  const user = userEvent.setup()

  await user.click(within(camryCard()).getByRole('button', { name: /delete/i }))
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i }))

  expect(api.remove).not.toHaveBeenCalled()
  expect(camryCard()).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a failed delete shows the reason in the dialog', async () => {
  api.remove.mockRejectedValue(new ApiError(404, 'Vehicle not found'))
  await renderAs(admin)
  const user = userEvent.setup()

  await user.click(within(camryCard()).getByRole('button', { name: /delete/i }))
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }))

  expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Vehicle not found')
})

test('Escape closes an open dialog', async () => {
  await renderAs(admin)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /add vehicle/i }))
  await user.keyboard('{Escape}')

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

function camryWithoutId() {
  const { id: _id, ...rest } = camry
  return rest
}
