// Fixed, decorative backdrop for the app pages: the landing page's night sky, toned down so
// content stays readable, with the far skyline drifting along the bottom.
import { FarSkyline, Stars } from './nightSky'

export function NightBackdrop() {
  return (
    <div data-testid="night-backdrop" aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#060816] via-[#100f2c] to-[#1d1236]">
      <Stars />
      <FarSkyline fill="#17163a" light="#fde68a40" testId="skyline"
        className="bottom-0 h-[28%] opacity-70 animate-skyline-far" />
      <div className="absolute inset-x-0 bottom-0 h-1 animate-road bg-[repeating-linear-gradient(90deg,#facc15_0_60px,transparent_60px_120px)] opacity-40" />
    </div>
  )
}
