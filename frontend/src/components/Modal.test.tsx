import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

function renderInsideAnimatedPage(onClose = vi.fn()) {
  // Page content is animated with transforms; a position:fixed dialog inside a transformed
  // element is placed relative to that element (mid-page), not the screen.
  return render(
    <main data-testid="page" style={{ transform: 'translateY(0)' }}>
      <Modal title="Buy Toyota Camry" onClose={onClose}>
        <p>Checkout</p>
      </Modal>
    </main>,
  )
}

afterEach(() => {
  document.body.style.overflow = ''
})

test('renders at the top of the document, outside the page, so it opens where the user is', () => {
  renderInsideAnimatedPage()

  const dialog = screen.getByRole('dialog', { name: 'Buy Toyota Camry' })
  expect(screen.getByTestId('page')).not.toContainElement(dialog)
  expect(dialog.closest('body > *')?.parentElement).toBe(document.body)
})

test('stops the page scrolling behind it, and restores scrolling when closed', () => {
  document.body.style.overflow = 'auto'
  const { unmount } = renderInsideAnimatedPage()

  expect(document.body.style.overflow).toBe('hidden')
  unmount()
  expect(document.body.style.overflow).toBe('auto')
})

test('closes on Escape', async () => {
  const onClose = vi.fn()
  renderInsideAnimatedPage(onClose)

  await userEvent.keyboard('{Escape}')

  expect(onClose).toHaveBeenCalled()
})
