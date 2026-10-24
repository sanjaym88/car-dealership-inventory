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

const tagline = /your next dream car/i

test('logged-out visitors to the dashboard land on the welcome page', () => {
  renderAt('/')

  expect(screen.getByText(tagline)).toBeInTheDocument()
})

test('the login page opens the login form over the welcome scene', () => {
  renderAt('/login')

  expect(screen.getByText(tagline)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
})

test('the register page is reachable', () => {
  renderAt('/register')

  expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
})

test('unknown paths fall back to the dashboard (and so to the welcome page)', () => {
  renderAt('/no-such-page')

  expect(screen.getByText(tagline)).toBeInTheDocument()
})

test('my orders needs a login', () => {
  renderAt('/orders')

  expect(screen.getByText(tagline)).toBeInTheDocument()
})
