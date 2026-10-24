import { act, render, screen } from '@testing-library/react'
import { HeroSlideshow } from './HeroSlideshow'

// Real clip lengths differ, so each is shown for exactly one play of itself.
const SLIDES = [
  { src: '/one.gif', duration: 2400 },
  { src: '/two.gif', duration: 1740 },
  { src: '/three.gif', duration: 1950 },
]

function images() {
  return screen.getAllByRole('presentation', { hidden: true }) as HTMLImageElement[]
}

function active() {
  return images().findIndex((img) => img.dataset.active === 'true')
}

async function flushLoads() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

let objectUrls = 0

beforeEach(() => {
  vi.useFakeTimers()
  objectUrls = 0
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(['gif'])) }))
  URL.createObjectURL = vi.fn(() => `blob:fresh-${++objectUrls}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('is decorative, so screen readers skip it', () => {
  render(<HeroSlideshow slides={SLIDES} />)

  expect(screen.getByTestId('hero-slideshow')).toHaveAttribute('aria-hidden', 'true')
  expect(images()).toHaveLength(3)
})

test('plays each clip once, in order 1 2 3 1 2 3, timed to each clip', async () => {
  render(<HeroSlideshow slides={SLIDES} />)
  await flushLoads()
  expect(active()).toBe(0)

  act(() => vi.advanceTimersByTime(2399))
  expect(active()).toBe(0) // clip 1 has not finished its single play yet

  act(() => vi.advanceTimersByTime(1))
  expect(active()).toBe(1)

  act(() => vi.advanceTimersByTime(1740))
  expect(active()).toBe(2)

  act(() => vi.advanceTimersByTime(1950))
  expect(active()).toBe(0)

  act(() => vi.advanceTimersByTime(2400))
  expect(active()).toBe(1)
})

test('each clip restarts from its first frame when its turn comes round again', async () => {
  render(<HeroSlideshow slides={SLIDES} />)
  await flushLoads()
  const firstPlay = images()[0].src

  act(() => vi.advanceTimersByTime(2400 + 1740 + 1950)) // back to clip 1

  // A new object URL makes the browser start the GIF over, without downloading it again.
  expect(images()[0].src).toMatch(/^blob:fresh-/)
  expect(images()[0].src).not.toBe(firstPlay)
  expect(fetch).toHaveBeenCalledTimes(3)
})

test('holds still for people who prefer reduced motion', () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
  render(<HeroSlideshow slides={SLIDES} />)

  act(() => vi.advanceTimersByTime(20000))

  expect(active()).toBe(0)
  delete (window as Partial<Window>).matchMedia
})
