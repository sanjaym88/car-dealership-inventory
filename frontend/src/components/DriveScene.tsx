// The landing page's moving backdrop: a night drive past a city skyline. Pure SVG/CSS,
// so it is sharp at any size, loads instantly and needs no licensed footage.
import { CarSilhouette } from './CarSilhouette'
import { FarSkyline, NearSkyline, Stars } from './nightSky'

export function DriveScene() {
  return (
    <div data-testid="drive-scene" aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#060816] via-[#141238] to-[#3b1d4a]">
      {/* stars and moon */}
      <Stars />
      <div className="absolute right-[12%] top-[10%] h-16 w-16 rounded-full bg-amber-100 shadow-[0_0_60px_20px_rgba(254,243,199,0.25)]" />

      {/* city: far layer drifts slowly, near layer faster (parallax) */}
      <FarSkyline testId="skyline" className="bottom-[26%] h-[34%] animate-skyline-far" />
      <NearSkyline className="bottom-[26%] h-[22%] animate-skyline-near" />

      {/* road with moving lane markings */}
      <div data-testid="road" className="absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-b from-[#1f2030] to-[#0b0c14]">
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
        <div className="absolute inset-x-0 top-[42%] h-1.5 animate-road bg-[repeating-linear-gradient(90deg,#facc15_0_60px,transparent_60px_120px)] opacity-80" />
      </div>

      {/* the car, with headlight beam, cruising in place while the world moves */}
      <div className="absolute bottom-[14%] left-1/2 w-[min(46vw,420px)] -translate-x-1/2">
        <div className="absolute left-[94%] top-[38%] h-14 w-[70%] origin-left -translate-y-1/2 animate-beam bg-gradient-to-r from-amber-100/50 via-amber-100/10 to-transparent opacity-30 blur-[2px] [clip-path:polygon(0_45%,100%_0,100%_100%,0_55%)]" />
        <div className="animate-car-bob">
          <CarSilhouette className="w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)]"
            wheelClassName="animate-spin-wheel" wheelTestId="scene-wheel" />
        </div>
      </div>
    </div>
  )
}
