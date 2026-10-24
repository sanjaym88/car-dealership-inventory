import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { admin, alice, authState } from '../test/authMock'
import { Header } from './Header'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

function renderHeader(user: typeof alice, path = '/') {
  mockedUseAuth.mockReturnValue(authState({ user }))
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  )
}

test('links to the inventory and my orders', () => {
  renderHeader(alice)

  expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'My orders' })).toHaveAttribute('href', '/orders')
})

test('only admins get the Sales link', () => {
  renderHeader(alice)
  expect(screen.queryByRole('link', { name: 'Sales' })).not.toBeInTheDocument()
})

test('admins see the Sales link', () => {
  renderHeader(admin)
  expect(screen.getByRole('link', { name: 'Sales' })).toHaveAttribute('href', '/sales')
})

test('marks the current page', () => {
  renderHeader(alice, '/orders')

  expect(screen.getByRole('link', { name: 'My orders' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Inventory' })).not.toHaveAttribute('aria-current')
})
