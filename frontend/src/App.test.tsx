// Routing smoke tests: the real App with AuthProvider, starting logged out.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

test('logged-out visitors to the dashboard land on the login page', () => {
  renderAt('/')

  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
})

test('the register page is reachable', () => {
  renderAt('/register')

  expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
})

test('unknown paths fall back to the dashboard (and so to login)', () => {
  renderAt('/no-such-page')

  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
})
