// Full-bleed background of night-driving clips that crossfade on a timer, with a slow zoom and
// a dark gradient on top so the headline stays readable over the low-resolution footage.
import { useEffect, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function HeroSlideshow({ slides, interval = 6000 }: { slides: string[]; interval?: number }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length < 2 || prefersReducedMotion()) return
    const timer = window.setInterval(() => setActive((i) => (i + 1) % slides.length), interval)
    return () => window.clearInterval(timer)
  }, [slides.length, interval])

  return (
    <div data-testid="hero-slideshow" aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#060816]">
      {slides.map((src, i) => (
        <img key={src} src={src} alt="" role="presentation" data-active={i === active}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full animate-ken-burns object-cover transition-opacity duration-[1600ms] ease-in-out ${
            i === active ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      {/* legibility: darken overall, deepen top and bottom, vignette the edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-[#060816]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  )
}
