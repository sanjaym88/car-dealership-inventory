// Holds who is logged in and exposes login/register/logout to the whole app (read it with useAuth).
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { User } from '../api/types'
import { AuthContext } from './context'
import { tokenStorage } from './tokenStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStorage.get() !== null)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // On first load, turn a stored token back into a user (or discard it if the server says no).
  useEffect(() => {
    if (tokenStorage.get() === null) return
    authApi
      .me()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await authApi.login(email, password)
    tokenStorage.set(access_token)
    setUser(await authApi.me())
  }, [])

  const register = useCallback(
    async (email: string, password: string) => {
      await authApi.register(email, password)
      await login(email, password)
    },
    [login],
  )

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
