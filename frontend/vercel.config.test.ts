// @vitest-environment node
// Guards the production routing in vercel.json: API calls go to the backend, everything else to the SPA.
import { readFileSync } from 'node:fs'

interface Rewrite {
  source: string
  destination: string
}

const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
  rewrites: Rewrite[]
}

test('forwards /api requests to the backend over https, keeping the /api prefix', () => {
  const api = config.rewrites[0]

  expect(api.source).toBe('/api/:path*')
  expect(api.destination).toMatch(/^https:\/\/[^/]+\/api\/:path\*$/)
})

test('serves index.html for every other path so client-side routes survive a refresh', () => {
  const last = config.rewrites[config.rewrites.length - 1]

  expect(last).toEqual({ source: '/(.*)', destination: '/index.html' })
})

test('the API rule comes before the catch-all, or API calls would get index.html', () => {
  const sources = config.rewrites.map((r) => r.source)

  expect(sources.indexOf('/api/:path*')).toBeLessThan(sources.indexOf('/(.*)'))
})
