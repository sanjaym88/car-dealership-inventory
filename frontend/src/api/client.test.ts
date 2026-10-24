import { ApiError, apiFetch } from './client'
import { tokenStorage } from '../auth/tokenStorage'

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  tokenStorage.clear()
})

test('sends a JSON body and returns the parsed response', async () => {
  const fetchMock = mockFetch(201, { id: 1 })

  const result = await apiFetch('/api/things', { method: 'POST', body: { name: 'x' } })

  expect(result).toEqual({ id: 1 })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('/api/things')
  expect(init.method).toBe('POST')
  expect(init.body).toBe(JSON.stringify({ name: 'x' }))
  expect(init.headers['Content-Type']).toBe('application/json')
})

test('attaches the stored token as a bearer header', async () => {
  const fetchMock = mockFetch(200, [])
  tokenStorage.set('abc.def.ghi')

  await apiFetch('/api/vehicles')

  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc.def.ghi')
})

test('sends no Authorization header when logged out', async () => {
  const fetchMock = mockFetch(200, [])

  await apiFetch('/api/vehicles')

  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
})

test('throws ApiError with status and server message on failure', async () => {
  mockFetch(409, { detail: 'Vehicle is out of stock' })

  const error = await apiFetch('/api/vehicles/1/purchase', { method: 'POST' }).catch((e) => e)

  expect(error).toBeInstanceOf(ApiError)
  expect(error.status).toBe(409)
  expect(error.message).toBe('Vehicle is out of stock')
})

test('turns FastAPI validation errors into a readable message', async () => {
  mockFetch(422, { detail: [{ msg: 'Input should be greater than 0', loc: ['body', 'price'] }] })

  const error = await apiFetch('/api/vehicles', { method: 'POST', body: {} }).catch((e) => e)

  expect(error.status).toBe(422)
  expect(error.message).toBe('price: Input should be greater than 0')
})

test('returns undefined for 204 No Content', async () => {
  mockFetch(204)

  await expect(apiFetch('/api/vehicles/1', { method: 'DELETE' })).resolves.toBeUndefined()
})
