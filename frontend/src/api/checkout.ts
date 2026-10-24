import { apiFetch } from './client'
import type { CheckoutOptions } from './types'

export const checkoutApi = {
  options: () => apiFetch<CheckoutOptions>('/api/checkout/options'),
}
