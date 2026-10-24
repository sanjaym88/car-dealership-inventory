// Fixed, decorative backdrop for the app pages: a flat near-black night with stars and the far
// skyline drifting along the bottom, kept quiet so content stays readable.
import { FarSkyline, Stars } from './nightSky'

export function NightBackdrop() {
  return (
    <div data-testid="night-backdrop" aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-neutral-950">
      <Stars />
      <FarSkyline fill="#1c1c1f" light="#fde68a40" testId="skyline"
        className="bottom-0 h-[28%] opacity-70 animate-skyline-far" />
      <div className="absolute inset-x-0 bottom-0 h-1 animate-road bg-[repeating-linear-gradient(90deg,#facc15_0_60px,transparent_60px_120px)] opacity-40" />
    </div>
  )
}
