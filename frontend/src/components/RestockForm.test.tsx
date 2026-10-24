import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestockForm } from './RestockForm'

function renderForm() {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()
  render(<RestockForm onSubmit={onSubmit} onCancel={onCancel} />)
  return { onSubmit, onCancel, user: userEvent.setup() }
}

test('submits the number of units to add', async () => {
  const { onSubmit, user } = renderForm()

  await user.type(screen.getByLabelText(/units to add/i), '4')
  await user.click(screen.getByRole('button', { name: /restock/i }))

  expect(onSubmit).toHaveBeenCalledWith(4)
})

test.each(['0', '-2', '1.5', ''])('rejects %j without submitting', async (value) => {
  const { onSubmit, user } = renderForm()

  if (value) await user.type(screen.getByLabelText(/units to add/i), value)
  await user.click(screen.getByRole('button', { name: /restock/i }))

  expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole number of at least 1')
  expect(onSubmit).not.toHaveBeenCalled()
})

test('cancel closes without submitting', async () => {
  const { onSubmit, onCancel, user } = renderForm()

  await user.click(screen.getByRole('button', { name: /cancel/i }))

  expect(onCancel).toHaveBeenCalled()
  expect(onSubmit).not.toHaveBeenCalled()
})
