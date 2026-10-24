// The context object and its shape, shared by AuthProvider (writes) and useAuth (reads).
import { createContext } from 'react'
import type { User } from '../api/types'

export interface AuthState {
  user: User | null
  /** True while a stored token is being checked on first load. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
