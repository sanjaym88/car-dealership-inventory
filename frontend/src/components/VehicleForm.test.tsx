import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../api/client'
import type { VehicleInput } from '../api/types'
import { VehicleForm } from './VehicleForm'

const camry: VehicleInput = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 }

function renderForm(initial?: VehicleInput) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()
  render(<VehicleForm initial={initial} submitLabel="Save" onSubmit={onSubmit} onCancel={onCancel} />)
  return { onSubmit, onCancel, user: userEvent.setup() }
}

async function fill(user: ReturnType<typeof userEvent.setup>, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    const input = screen.getByLabelText(new RegExp(`^${label}`, 'i'))
    await user.clear(input)
    if (value) await user.type(input, value)
  }
}

test('submits the entered vehicle with numeric price and quantity', async () => {
  const { onSubmit, user } = renderForm()

  await fill(user, { make: 'Honda', model: 'Civic', category: 'Sedan', price: '23500', quantity: '8' })
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(onSubmit).toHaveBeenCalledWith({
    make: 'Honda', model: 'Civic', category: 'Sedan', price: 23500, quantity: 8,
  })
})

test('starts with the current values when editing', async () => {
  const { onSubmit, user } = renderForm(camry)

  expect(screen.getByLabelText(/^make/i)).toHaveValue('Toyota')
  expect(screen.getByLabelText(/^price/i)).toHaveValue(25000)
  await fill(user, { price: '23999.99' })
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(onSubmit).toHaveBeenCalledWith({ ...camry, price: 23999.99 })
})

test.each([
  [{ make: '' }, 'Make is required'],
  [{ model: '   ' }, 'Model is required'],
  [{ category: '' }, 'Category is required'],
  [{ price: '0' }, 'Price must be greater than 0'],
  [{ price: '' }, 'Price must be greater than 0'],
  [{ quantity: '-1' }, 'Quantity must be a whole number of 0 or more'],
  [{ quantity: '1.5' }, 'Quantity must be a whole number of 0 or more'],
])('rejects invalid input %o with "%s" without submitting', async (values, message) => {
  const { onSubmit, user } = renderForm(camry)

  await fill(user, values)
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(screen.getByRole('alert')).toHaveTextContent(message)
  expect(onSubmit).not.toHaveBeenCalled()
})

test('shows the server error and keeps the form open', async () => {
  const { onSubmit, user } = renderForm(camry)
  onSubmit.mockRejectedValue(new ApiError(403, 'Admin privileges required'))

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Admin privileges required')
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
})

test('cancel closes without submitting', async () => {
  const { onSubmit, onCancel, user } = renderForm(camry)

  await user.click(screen.getByRole('button', { name: /cancel/i }))

  expect(onCancel).toHaveBeenCalled()
  expect(onSubmit).not.toHaveBeenCalled()
})
