import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { alice, authState } from '../test/authMock'
import { PageShell } from './PageShell'

vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }))

function renderShell() {
  vi.mocked(useAuth).mockReturnValue(authState({ user: alice }))
  render(
    <MemoryRouter>
      <PageShell title="Inventory" subtitle="30 models">
        <p>Content</p>
      </PageShell>
    </MemoryRouter>,
  )
}

test('shows a top bar with a breadcrumb, then the title, subtitle and content', () => {
  renderShell()

  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('AutoVault/Inventory')
  expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
  expect(screen.getByText('30 models')).toBeInTheDocument()
  expect(screen.getByText('Content')).toBeInTheDocument()
})

test('has a sidebar with the shop section and its links', () => {
  renderShell()

  const sidebar = screen.getByRole('complementary', { name: 'Sidebar' })
  expect(within(sidebar).getByText('Shop')).toBeInTheDocument()
  expect(within(sidebar).getByRole('link', { name: 'Inventory' })).toBeInTheDocument()
  expect(within(sidebar).getByRole('link', { name: 'My orders' })).toBeInTheDocument()
})
