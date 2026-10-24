// Sample orders for tests.
import type { AdminOrder, Order } from '../api/types'

export const camryOrder: Order = {
  id: 7, vehicle_id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan',
  image_url: 'https://example.com/camry.jpg',
  base_price: 25000, color: 'racing_red', package: 'premium', addons: ['tinted_windows'],
  delivery: 'home',
  line_items: [
    { label: 'Toyota Camry (base price)', price: 25000 },
    { label: 'Paint: Racing Red', price: 500 },
    { label: 'Package: Premium', price: 3500 },
    { label: 'Add-on: Tinted windows', price: 300 },
    { label: 'Delivery: Home delivery', price: 250 },
  ],
  total_price: 29550,
  created_at: '2026-10-24T12:00:00Z',
}

export const civicOrder: Order = {
  id: 3, vehicle_id: null, make: 'Honda', model: 'Civic', category: 'Sedan', image_url: null,
  base_price: 24650, color: 'arctic_white', package: 'standard', addons: [], delivery: 'pickup',
  line_items: [{ label: 'Honda Civic (base price)', price: 24650 }],
  total_price: 24650,
  created_at: '2026-10-20T12:00:00Z',
}

export const sales: AdminOrder[] = [
  { ...camryOrder, buyer_email: 'alice@example.com' },
  { ...civicOrder, buyer_email: 'bob@example.com' },
]
