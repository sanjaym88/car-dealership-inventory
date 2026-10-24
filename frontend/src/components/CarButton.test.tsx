import { render, screen } from '@testing-library/react'
import { CarButton } from './CarButton'

test('is a submit button named by its label', () => {
  render(<CarButton label="Log in" pendingLabel="Logging in…" pending={false} />)

  const button = screen.getByRole('button', { name: 'Log in' })
  expect(button).toHaveAttribute('type', 'submit')
  expect(button).toBeEnabled()
})

test('draws a car with two wheels', () => {
  render(<CarButton label="Log in" pendingLabel="Logging in…" pending={false} />)

  expect(screen.getAllByTestId('car-wheel')).toHaveLength(2)
})

test('while pending it is disabled, relabelled and marked as driving', () => {
  render(<CarButton label="Log in" pendingLabel="Logging in…" pending />)

  const button = screen.getByRole('button', { name: 'Logging in…' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('data-driving', 'true')
})
