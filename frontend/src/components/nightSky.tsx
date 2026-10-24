// Night-sky pieces shared by the landing scene and the app's page backdrop.

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

export function Stars() {
  return (
    <>
      {STARS.map((star, i) => (
        <span key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />
      ))}
    </>
  )
}

type SkylineProps = { className: string; light?: string; fill?: string; testId?: string }

/** Tall, distant buildings; drifts slowly. */
export function FarSkyline({ className, fill = '#1b1a3d', light = '#fde68a55', testId }: SkylineProps) {
  return <Skyline list={FAR} fill={fill} light={light} className={className} testId={testId} />
}

/** Lower, closer buildings; drifts faster for parallax. */
export function NearSkyline({ className, fill = '#0f0e24', light = '#fbbf2499', testId }: SkylineProps) {
  return <Skyline list={NEAR} fill={fill} light={light} className={className} testId={testId} />
}
