// @vitest-environment node
// Design guard: the website must not use emojis anywhere in its source.
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

test('the website has no emojis', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u

  expect(FILES.filter((file) => emoji.test(file.text)).map((file) => file.path)).toEqual([])
})
