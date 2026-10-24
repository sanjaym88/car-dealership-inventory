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

export interface VehicleSearchParams {
  make?: string
  model?: string
  category?: string
  min_price?: number
  max_price?: number
}
