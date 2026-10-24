import { act, render, screen } from '@testing-library/react'
import { HeroSlideshow } from './HeroSlideshow'

const SLIDES = ['/a.gif', '/b.gif', '/c.gif']

function active() {
  return screen.getAllByRole('presentation').findIndex((img) => img.dataset.active === 'true')
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('is decorative, so screen readers skip it', () => {
  render(<HeroSlideshow slides={SLIDES} />)

  expect(screen.getByTestId('hero-slideshow')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getAllByRole('presentation')).toHaveLength(3)
})

test('starts on the first clip and crossfades to the next on a timer, looping round', () => {
  render(<HeroSlideshow slides={SLIDES} interval={5000} />)
  expect(active()).toBe(0)

  act(() => vi.advanceTimersByTime(5000))
  expect(active()).toBe(1)

  act(() => vi.advanceTimersByTime(10000))
  expect(active()).toBe(0)
})

test('holds still for people who prefer reduced motion', () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
  render(<HeroSlideshow slides={SLIDES} interval={5000} />)

  act(() => vi.advanceTimersByTime(20000))

  expect(active()).toBe(0)
  delete (window as Partial<Window>).matchMedia
})
