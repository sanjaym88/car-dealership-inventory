// @vitest-environment node
// Design guard: fails if the frontend source picks up common "generic AI UI" patterns we have
// decided against. Scans every non-test source file plus index.html.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'assets' ? [] : sourceFiles(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })
}

const FILES = [...sourceFiles(join(ROOT, 'src')), join(ROOT, 'index.html')].map((path) => ({
  path: relative(ROOT, path),
  text: readFileSync(path, 'utf8'),
}))

const BANNED: [string, RegExp][] = [
  ['purple/blue gradients', /(from|via|to)-(purple|violet|indigo|blue|fuchsia)-|#(100f2c|1d1236|141238|3b1d4a|17163a|1b1a3d)/i],
  ['gradient text', /bg-clip-text/],
  ['emojis', /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u],
  ['Inter / Space Grotesk / Instrument Serif fonts', /\b(Inter|Space Grotesk|Instrument Serif)\b['"]/],
  ['coloured left-border cards', /\bborder-l-(2|4|8)\b/],
  ['glassmorphism (blur over translucency)', /backdrop-blur/],
  ['fade-in / slide-in entrance animations', /animate-(fade-up|panel-in|\[fade)|@keyframes (fade-up|fade-in|panel-in)/],
  ['buttons that fade on hover', /hover:(opacity-|bg-white\/|bg-black\/)/],
  ['low-contrast translucent text', /text-white\/\d+/],
  ['Lucide icons', /lucide/i],
  ['em dashes', /—/],
  ['serif italic accents', /\bfont-serif\b|\bitalic\b/],
  ['grain / noise texture', /\b(grain|noise)\b/i],
]

test.each(BANNED)('the frontend has no %s', (_label, pattern) => {
  const offenders = FILES.filter((file) => pattern.test(file.text)).map((file) => file.path)

  expect(offenders).toEqual([])
})
