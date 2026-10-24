// Shapes of the data the backend sends and accepts (mirror of the FastAPI schemas).

export interface User {
  id: number
  email: string
  is_admin: boolean
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Vehicle {
  id: number
  make: string
  model: string
  category: string
  price: number
  quantity: number
  image_url?: string | null
}

export type VehicleInput = Omit<Vehicle, 'id'>

export interface CheckoutOption {
  code: string
  label: string
  price: number
  description: string
}

export interface CheckoutOptions {
  colors: CheckoutOption[]
  packages: CheckoutOption[]
  addons: CheckoutOption[]
  delivery: CheckoutOption[]
}

/** What the buyer picked: option codes only; the server prices them. */
export interface CheckoutSelection {
  color: string
  package: string
  addons: string[]
  delivery: string
}

export interface LineItem {
  label: string
  price: number
}

export interface Order {
  id: number
  vehicle_id: number | null
  make: string
  model: string
  category: string
  image_url: string | null
  base_price: number
  color: string
  package: string
  addons: string[]
  delivery: string
  line_items: LineItem[]
  total_price: number
  created_at: string
}

export interface AdminOrder extends Order {
  buyer_email: string
}

export interface PurchaseResult {
  vehicle: Vehicle
  order: Order
}

export interface VehicleSearchParams {
  make?: string
  model?: string
  category?: string
  min_price?: number
  max_price?: number
}
