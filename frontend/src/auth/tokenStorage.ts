// Keeps the JWT in localStorage so a page refresh doesn't log the user out.
const KEY = 'car-dealership.token'

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(KEY),
  set: (token: string) => localStorage.setItem(KEY, token),
  clear: () => localStorage.removeItem(KEY),
}
