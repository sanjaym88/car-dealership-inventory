import { apiFetch } from './client'
import type { Token, User } from './types'

export const authApi = {
  register: (email: string, password: string) =>
    apiFetch<User>('/api/auth/register', { method: 'POST', body: { email, password } }),

  login: (email: string, password: string) =>
    apiFetch<Token>('/api/auth/login', { method: 'POST', body: { email, password } }),

  me: () => apiFetch<User>('/api/auth/me'),
}
