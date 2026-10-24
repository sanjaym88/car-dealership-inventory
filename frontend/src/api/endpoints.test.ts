import { authApi } from './auth'
import { checkoutApi } from './checkout'
import { apiFetch } from './client'
import { ordersApi } from './orders'
import { vehiclesApi } from './vehicles'

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn().mockResolvedValue(undefined),
}))

const fetchMock = vi.mocked(apiFetch)
const camry = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 }

afterEach(() => fetchMock.mockClear())

describe('authApi', () => {
  test('register posts credentials', async () => {
    await authApi.register('a@b.com', 'secret123')
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'secret123' },
    })
  })

  test('login posts credentials', async () => {
    await authApi.login('a@b.com', 'secret123')
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'secret123' },
    })
  })

  test('me fetches the current user', async () => {
    await authApi.me()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me')
  })
})

describe('vehiclesApi', () => {
  test('list', async () => {
    await vehiclesApi.list()
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles')
  })

  test('search sends only filled-in filters', async () => {
    await vehiclesApi.search({ make: 'Toy', model: '', category: undefined, min_price: 1000 })
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles/search?make=Toy&min_price=1000')
  })

  test('create', async () => {
    await vehiclesApi.create(camry)
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles', { method: 'POST', body: camry })
  })

  test('update', async () => {
    await vehiclesApi.update(7, { price: 20000 })
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles/7', {
      method: 'PUT',
      body: { price: 20000 },
    })
  })

  test('remove', async () => {
    await vehiclesApi.remove(7)
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles/7', { method: 'DELETE' })
  })

  test('purchase sends the checkout selection', async () => {
    const selection = { color: 'racing_red', package: 'sport', addons: ['tinted_windows'], delivery: 'home' }
    await vehiclesApi.purchase(7, selection)
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles/7/purchase', { method: 'POST', body: selection })
  })

  test('restock', async () => {
    await vehiclesApi.restock(7, 3)
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles/7/restock', {
      method: 'POST',
      body: { quantity: 3 },
    })
  })
})

describe('checkoutApi', () => {
  test('options', async () => {
    await checkoutApi.options()
    expect(fetchMock).toHaveBeenCalledWith('/api/checkout/options')
  })
})

describe('ordersApi', () => {
  test('mine', async () => {
    await ordersApi.mine()
    expect(fetchMock).toHaveBeenCalledWith('/api/orders/me')
  })

  test('all (admin)', async () => {
    await ordersApi.all()
    expect(fetchMock).toHaveBeenCalledWith('/api/orders')
  })
})
