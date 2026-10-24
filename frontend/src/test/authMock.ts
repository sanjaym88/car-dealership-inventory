// Helpers for tests that mock `useAuth` (call vi.mock('<path>/auth/useAuth') in the test file).
import type { User } from '../api/types'
import type { AuthState } from '../auth/context'

export const alice: User = { id: 1, email: 'alice@example.com', is_admin: false }
export const admin: User = { id: 2, email: 'admin@example.com', is_admin: true }

export function authState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    user: null,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    ...overrides,
  }
}
