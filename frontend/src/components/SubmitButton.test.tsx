import { render, screen } from '@testing-library/react'
import { SubmitButton } from './SubmitButton'

test('is a full-width submit pill named by its label', () => {
  render(<SubmitButton label="Log in" pendingLabel="Logging in…" pending={false} />)

  const button = screen.getByRole('button', { name: 'Log in' })
  expect(button).toHaveAttribute('type', 'submit')
  expect(button).toBeEnabled()
  expect(button).toHaveClass('rounded-full', 'w-full')
})

test('while pending it is disabled, relabelled and marked busy', () => {
  render(<SubmitButton label="Log in" pendingLabel="Logging in…" pending />)

  const button = screen.getByRole('button', { name: 'Logging in…' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})
