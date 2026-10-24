import { apiFetch } from './client'
import type { AdminOrder, Order } from './types'

export const ordersApi = {
  mine: () => apiFetch<Order[]>('/api/orders/me'),
  /** Admin only. */
  all: () => apiFetch<AdminOrder[]>('/api/orders'),
}
