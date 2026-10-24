import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Vehicle } from '../api/types'
import { VehicleCard } from './VehicleCard'

const camry: Vehicle = { id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 }

test('the Purchase button buys this vehicle', async () => {
  const onPurchase = vi.fn()
  render(<VehicleCard vehicle={camry} onPurchase={onPurchase} />)

  await userEvent.click(screen.getByRole('button', { name: /purchase/i }))

  expect(onPurchase).toHaveBeenCalledWith(camry)
})

test('the Purchase button is disabled when the vehicle is out of stock', () => {
  render(<VehicleCard vehicle={{ ...camry, quantity: 0 }} onPurchase={vi.fn()} />)

  expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled()
})

test('the Purchase button is disabled and relabelled while a purchase is in flight', () => {
  render(<VehicleCard vehicle={camry} onPurchase={vi.fn()} purchasing />)

  expect(screen.getByRole('button', { name: /purchasing/i })).toBeDisabled()
})

// --- photos ---

const photo = 'https://upload.wikimedia.org/camry.jpg'

test('shows the vehicle photo, described by make and model', () => {
  render(<VehicleCard vehicle={{ ...camry, image_url: photo }} onPurchase={vi.fn()} />)

  expect(screen.getByRole('img', { name: 'Toyota Camry' })).toHaveAttribute('src', photo)
})

test('shows a placeholder when the vehicle has no photo', () => {
  render(<VehicleCard vehicle={{ ...camry, image_url: null }} onPurchase={vi.fn()} />)

  expect(screen.getByRole('img', { name: /no photo/i })).toBeInTheDocument()
})

test('falls back to the placeholder when the photo fails to load', () => {
  render(<VehicleCard vehicle={{ ...camry, image_url: photo }} onPurchase={vi.fn()} />)

  fireEvent.error(screen.getByRole('img', { name: 'Toyota Camry' }))

  expect(screen.getByRole('img', { name: /no photo/i })).toBeInTheDocument()
})
