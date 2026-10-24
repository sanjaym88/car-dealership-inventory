// Full-bleed background of night-driving clips. Each clip plays exactly once, timed to its own
// length, then crossfades to the next: 1 2 3 1 2 3. A dark gradient keeps the headline readable.
import { useCallback, useEffect, useRef, useState } from 'react'

export interface Slide {
  src: string
  /** Length of one play of the GIF, in ms (sum of its frame delays). */
  duration: number
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * A GIF that is already playing keeps its place, even if its <img> is shown again. To restart
 * a clip from frame 0 we fetch each file once, then hand the browser a brand-new object URL
 * every time that clip's turn comes, with no extra download.
 */
function useRestartableSources(slides: Slide[]) {
  const blobs = useRef<(Blob | null)[]>(slides.map(() => null))
  const [urls, setUrls] = useState<string[]>(() => slides.map((s) => s.src))

  // Load every clip once; the first one switches to its object URL as soon as it arrives.
  useEffect(() => {
    let cancelled = false
    slides.forEach((slide, i) => {
      fetch(slide.src)
        .then((response) => response.blob())
        .then((blob) => {
          if (cancelled) return
          blobs.current[i] = blob
          if (i === 0) setUrls((current) => replaceUrl(current, 0, URL.createObjectURL(blob)))
        })
        .catch(() => {}) // keep the plain src; the clip still shows, it just may not restart
    })
    return () => {
      cancelled = true
    }
  }, [slides])

  // Free the object URLs when the slideshow goes away.
  const latest = useRef(urls)
  useEffect(() => {
    latest.current = urls
  }, [urls])
  useEffect(() => () => latest.current.forEach(revokeIfObjectUrl), [])

  /** Fresh URL for a clip about to be shown; call it in the same update that shows the clip. */
  const restart = useCallback((index: number) => {
    const blob = blobs.current[index]
    if (blob) setUrls((current) => replaceUrl(current, index, URL.createObjectURL(blob)))
  }, [])

  return { urls, restart }
}

function replaceUrl(urls: string[], index: number, next: string): string[] {
  revokeIfObjectUrl(urls[index])
  return urls.map((url, i) => (i === index ? next : url))
}

function revokeIfObjectUrl(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url)
}

export function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0)
  const { urls, restart } = useRestartableSources(slides)

  // One play of the current clip, then move on. The next clip gets its fresh URL in the same
  // update that reveals it, so it is never seen mid-play.
  useEffect(() => {
    if (slides.length < 2 || prefersReducedMotion()) return
    const timer = window.setTimeout(() => {
      const next = (active + 1) % slides.length
      restart(next)
      setActive(next)
    }, slides[active].duration)
    return () => window.clearTimeout(timer)
  }, [active, slides, restart])

  return (
    <div data-testid="hero-slideshow" aria-hidden="true" className="absolute inset-0 overflow-hidden bg-neutral-950">
      {slides.map((slide, i) => (
        <img key={slide.src} src={urls[i]} alt="" role="presentation" data-active={i === active}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full animate-ken-burns object-cover transition-opacity duration-500 ease-in-out ${
            i === active ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      {/* legibility: darken overall, deepen top and bottom, vignette the edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-neutral-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  )
}
