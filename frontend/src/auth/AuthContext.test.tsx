import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthProvider } from './AuthContext'
import { tokenStorage } from './tokenStorage'
import { useAuth } from './useAuth'

vi.mock('../api/auth', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
}))

const api = vi.mocked(authApi)
const alice = { id: 1, email: 'alice@example.com', is_admin: false }
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

async function renderAuth() {
  const view = renderHook(() => useAuth(), { wrapper })
  await waitFor(() => expect(view.result.current.loading).toBe(false))
  return view
}

afterEach(() => {
  vi.resetAllMocks()
  tokenStorage.clear()
})

test('starts logged out when no token is stored', async () => {
  const { result } = await renderAuth()

  expect(result.current.user).toBeNull()
  expect(api.me).not.toHaveBeenCalled()
})

test('restores the session from a stored token', async () => {
  tokenStorage.set('stored-token')
  api.me.mockResolvedValue(alice)

  const { result } = await renderAuth()

  expect(result.current.user).toEqual(alice)
})

test('drops a stored token the server rejects', async () => {
  tokenStorage.set('expired-token')
  api.me.mockRejectedValue(new ApiError(401, 'Invalid or expired token'))

  const { result } = await renderAuth()

  expect(result.current.user).toBeNull()
  expect(tokenStorage.get()).toBeNull()
})

test('login stores the token and loads the user', async () => {
  api.login.mockResolvedValue({ access_token: 'new-token', token_type: 'bearer' })
  api.me.mockResolvedValue(alice)
  const { result } = await renderAuth()

  await act(() => result.current.login('alice@example.com', 'secret123'))

  expect(tokenStorage.get()).toBe('new-token')
  expect(result.current.user).toEqual(alice)
})

test('failed login leaves the user logged out and rethrows', async () => {
  api.login.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
  const { result } = await renderAuth()

  await expect(
    act(() => result.current.login('alice@example.com', 'wrong')),
  ).rejects.toThrow('Invalid email or password')
  expect(result.current.user).toBeNull()
})

test('register creates the account and then logs in', async () => {
  api.register.mockResolvedValue(alice)
  api.login.mockResolvedValue({ access_token: 'new-token', token_type: 'bearer' })
  api.me.mockResolvedValue(alice)
  const { result } = await renderAuth()

  await act(() => result.current.register('alice@example.com', 'secret123'))

  expect(api.register).toHaveBeenCalledWith('alice@example.com', 'secret123')
  expect(result.current.user).toEqual(alice)
})

test('logout clears the token and the user', async () => {
  tokenStorage.set('stored-token')
  api.me.mockResolvedValue(alice)
  const { result } = await renderAuth()

  act(() => result.current.logout())

  expect(result.current.user).toBeNull()
  expect(tokenStorage.get()).toBeNull()
})

test('useAuth outside AuthProvider throws a helpful error', () => {
  expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/)
})
