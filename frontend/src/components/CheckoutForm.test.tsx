import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../api/client'
import type { CheckoutOptions, Order, Vehicle } from '../api/types'
import { checkoutOptions } from '../test/checkoutFixtures'
import { CheckoutForm } from './CheckoutForm'

const camry: Vehicle = {
  id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5,
  image_url: 'https://example.com/camry.jpg',
}

const order: Order = {
  id: 42, vehicle_id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', image_url: null,
  base_price: 25000, color: 'racing_red', package: 'standard', addons: [], delivery: 'pickup',
  line_items: [
    { label: 'Toyota Camry (base price)', price: 25000 },
    { label: 'Paint: Racing Red', price: 500 },
  ],
  total_price: 25500, created_at: '2026-10-24T10:00:00Z',
}

function renderForm(options: CheckoutOptions | null = checkoutOptions) {
  const onConfirm = vi.fn().mockResolvedValue(order)
  const onClose = vi.fn()
  render(<CheckoutForm vehicle={camry} options={options} onConfirm={onConfirm} onClose={onClose} />)
  return { onConfirm, onClose, user: userEvent.setup() }
}

function total() {
  return screen.getByTestId('checkout-total').textContent
}

test('waits for the options to load', () => {
  renderForm(null)

  expect(screen.getByRole('status')).toHaveTextContent(/loading options/i)
})

test('starts with the free defaults, so the total is the base price', () => {
  renderForm()

  expect(screen.getByRole('radio', { name: /arctic white/i })).toBeChecked()
  expect(screen.getByRole('radio', { name: /standard/i })).toBeChecked()
  expect(screen.getByRole('radio', { name: /pick up/i })).toBeChecked()
  expect(screen.getAllByRole('checkbox').every((box) => !(box as HTMLInputElement).checked)).toBe(true)
  expect(total()).toBe('$25,000')
})

test('the total updates as options are chosen', async () => {
  const { user } = renderForm()

  await user.click(screen.getByRole('radio', { name: /racing red/i }))
  await user.click(screen.getByRole('radio', { name: /premium/i }))
  await user.click(screen.getByRole('checkbox', { name: /tinted windows/i }))
  await user.click(screen.getByRole('radio', { name: /home delivery/i }))

  // 25000 + 500 + 3500 + 300 + 250
  expect(total()).toBe('$29,550')
})

test('shows option prices next to each choice', () => {
  renderForm()

  expect(screen.getByRole('radio', { name: /racing red.*\+\$500/i })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: /extended warranty.*\+\$1,200/i })).toBeInTheDocument()
})

test('confirming sends only the chosen option codes', async () => {
  const { onConfirm, user } = renderForm()

  await user.click(screen.getByRole('radio', { name: /ocean blue/i }))
  await user.click(screen.getByRole('checkbox', { name: /ceramic coating/i }))
  await user.click(screen.getByRole('checkbox', { name: /all-weather mats/i }))
  await user.click(screen.getByRole('button', { name: /confirm purchase/i }))

  expect(onConfirm).toHaveBeenCalledWith({
    color: 'ocean_blue', package: 'standard',
    addons: ['ceramic_coating', 'all_weather_mats'], delivery: 'pickup',
  })
})

test('after confirming, shows the order number and the receipt from the server', async () => {
  const { onClose, user } = renderForm()

  await user.click(screen.getByRole('button', { name: /confirm purchase/i }))

  const receipt = await screen.findByRole('region', { name: /order #42 confirmed/i })
  expect(within(receipt).getByText('Paint: Racing Red')).toBeInTheDocument()
  expect(receipt).toHaveTextContent('$25,500')
  await user.click(screen.getByRole('button', { name: /done/i }))
  expect(onClose).toHaveBeenCalled()
})

test('shows the server error and stays on the form', async () => {
  const { onConfirm, user } = renderForm()
  onConfirm.mockRejectedValue(new ApiError(409, 'Vehicle is out of stock'))

  await user.click(screen.getByRole('button', { name: /confirm purchase/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle is out of stock')
  expect(screen.getByRole('button', { name: /confirm purchase/i })).toBeInTheDocument()
})

test('cancel closes without buying', async () => {
  const { onConfirm, onClose, user } = renderForm()

  await user.click(screen.getByRole('button', { name: /cancel/i }))

  expect(onClose).toHaveBeenCalled()
  expect(onConfirm).not.toHaveBeenCalled()
})
