import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { admin, alice, authState } from '../test/authMock'
import { AdminRoute } from './AdminRoute'
import { useAuth } from './useAuth'

vi.mock('./useAuth', () => ({ useAuth: vi.fn() }))

function renderAt(user: typeof alice) {
  vi.mocked(useAuth).mockReturnValue(authState({ user }))
  render(
    <MemoryRouter initialEntries={['/sales']}>
      <Routes>
        <Route path="/" element={<p>Inventory</p>} />
        <Route element={<AdminRoute />}>
          <Route path="/sales" element={<p>Sales page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('admins can open admin pages', () => {
  renderAt(admin)
  expect(screen.getByText('Sales page')).toBeInTheDocument()
})

test('regular users are sent back to the inventory', () => {
  renderAt(alice)
  expect(screen.getByText('Inventory')).toBeInTheDocument()
  expect(screen.queryByText('Sales page')).not.toBeInTheDocument()
})
