// Accessible dialog: labelled by its title, closes on Escape or a click on the backdrop.
//
// Rendered into <body> through a portal. Pages animate with CSS transforms, and a
// position:fixed element inside a transformed ancestor is placed relative to that ancestor
// instead of the screen, which would open the dialog mid-page rather than where the user is.
import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Keep the page behind still while the dialog is open.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <h2 id={titleId} className="mb-4 text-lg font-semibold text-white">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}
