// The same option catalog the backend serves, for tests.
import type { CheckoutOptions } from '../api/types'

export const checkoutOptions: CheckoutOptions = {
  colors: [
    { code: 'arctic_white', label: 'Arctic White', price: 0, description: '' },
    { code: 'midnight_black', label: 'Midnight Black', price: 0, description: '' },
    { code: 'racing_red', label: 'Racing Red', price: 500, description: '' },
    { code: 'ocean_blue', label: 'Ocean Blue', price: 500, description: '' },
  ],
  packages: [
    { code: 'standard', label: 'Standard', price: 0, description: 'Factory specification' },
    { code: 'premium', label: 'Premium', price: 3500, description: 'Leather seats and sunroof' },
    { code: 'sport', label: 'Sport', price: 2800, description: 'Alloy wheels and tuned suspension' },
  ],
  addons: [
    { code: 'extended_warranty', label: 'Extended warranty (5 years)', price: 1200, description: '' },
    { code: 'tinted_windows', label: 'Tinted windows', price: 300, description: '' },
    { code: 'all_weather_mats', label: 'All-weather mats', price: 150, description: '' },
    { code: 'ceramic_coating', label: 'Ceramic coating', price: 900, description: '' },
  ],
  delivery: [
    { code: 'pickup', label: 'Pick up at dealership', price: 0, description: '' },
    { code: 'home', label: 'Home delivery', price: 250, description: '' },
  ],
}
