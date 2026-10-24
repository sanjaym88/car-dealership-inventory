// The landing page's moving backdrop: a night drive past a city skyline. Pure SVG/CSS,
// so it is sharp at any size, loads instantly and needs no licensed footage.
import { CarSilhouette } from './CarSilhouette'

// Deterministic pseudo-random numbers, so the stars and buildings are the same on every render.
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const random = seeded(7)
const STARS = Array.from({ length: 45 }, () => ({
  left: random() * 100,
  top: random() * 55,
  size: random() < 0.85 ? 1 : 2,
  delay: random() * 3,
}))

interface Building { x: number; width: number; height: number; lights: { x: number; y: number }[] }

function buildings(seed: number, maxHeight: number): Building[] {
  const next = seeded(seed)
  const list: Building[] = []
  for (let x = 0; x < 1000; ) {
    const width = 30 + next() * 50
    const height = maxHeight * (0.35 + next() * 0.65)
    const lights = []
    for (let wy = 200 - height + 8; wy < 192; wy += 12) {
      for (let wx = x + 6; wx < x + width - 8; wx += 10) {
        if (next() < 0.28) lights.push({ x: wx, y: wy })
      }
    }
    list.push({ x, width, height, lights })
    x += width + 2
  }
  return list
}

const FAR = buildings(3, 150)
const NEAR = buildings(11, 110)

// Two copies side by side, scrolled by half their width, make a seamless loop.
function Skyline({ list, fill, light, className, testId }: {
  list: Building[]
  fill: string
  light: string
  className: string
  testId?: string
}) {
  return (
    <div data-testid={testId} className={`absolute inset-x-0 flex w-[200%] ${className}`}>
      {[0, 1].map((copy) => (
        <svg key={copy} viewBox="0 0 1000 200" preserveAspectRatio="none" className="h-full w-1/2">
          {list.map((b) => (
            <g key={b.x}>
              <rect x={b.x} y={200 - b.height} width={b.width} height={b.height} fill={fill} />
              {b.lights.map((l) => <rect key={`${l.x}-${l.y}`} x={l.x} y={l.y} width="4" height="5" fill={light} />)}
            </g>
          ))}
        </svg>
      ))}
    </div>
  )
}

export function DriveScene() {
  return (
    <div data-testid="drive-scene" aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#060816] via-[#141238] to-[#3b1d4a]">
      {/* stars and moon */}
      {STARS.map((star, i) => (
        <span key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />
      ))}
      <div className="absolute right-[12%] top-[10%] h-16 w-16 rounded-full bg-amber-100 shadow-[0_0_60px_20px_rgba(254,243,199,0.25)]" />

      {/* city: far layer drifts slowly, near layer faster (parallax) */}
      <Skyline list={FAR} fill="#1b1a3d" light="#fde68a55" testId="skyline"
        className="bottom-[26%] h-[34%] animate-skyline-far" />
      <Skyline list={NEAR} fill="#0f0e24" light="#fbbf2499" className="bottom-[26%] h-[22%] animate-skyline-near" />

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
