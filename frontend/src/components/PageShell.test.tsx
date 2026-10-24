import { render, screen } from '@testing-library/react'
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

test('shows the title, subtitle and content under the header', () => {
  renderShell()

  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
  expect(screen.getByText('30 models')).toBeInTheDocument()
  expect(screen.getByText('Content')).toBeInTheDocument()
})

test('sits on the same night-sky backdrop as the landing page, hidden from screen readers', () => {
  renderShell()

  const backdrop = screen.getByTestId('night-backdrop')
  expect(backdrop).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByTestId('skyline')).toBeInTheDocument()
})
