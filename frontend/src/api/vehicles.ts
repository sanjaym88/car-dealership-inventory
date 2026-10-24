import { apiFetch } from './client'
import type {
  CheckoutSelection,
  PurchaseResult,
  Vehicle,
  VehicleInput,
  VehicleSearchParams,
} from './types'

const BASE = '/api/vehicles'

// Only filters the user actually filled in become query parameters.
function toQuery(params: VehicleSearchParams): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.toString()
}

export const vehiclesApi = {
  list: () => apiFetch<Vehicle[]>(BASE),

  search: (params: VehicleSearchParams) => apiFetch<Vehicle[]>(`${BASE}/search?${toQuery(params)}`),

  create: (data: VehicleInput) => apiFetch<Vehicle>(BASE, { method: 'POST', body: data }),

  update: (id: number, data: Partial<VehicleInput>) =>
    apiFetch<Vehicle>(`${BASE}/${id}`, { method: 'PUT', body: data }),

  remove: (id: number) => apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  purchase: (id: number, selection: CheckoutSelection) =>
    apiFetch<PurchaseResult>(`${BASE}/${id}/purchase`, { method: 'POST', body: selection }),

  restock: (id: number, quantity: number) =>
    apiFetch<Vehicle>(`${BASE}/${id}/restock`, { method: 'POST', body: { quantity } }),
}
