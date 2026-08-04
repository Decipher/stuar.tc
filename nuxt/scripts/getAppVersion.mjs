// Reads the latest released version straight from the repo-root
// CHANGELOG.md, so nuxt.config.ts can expose it without a second,
// driftable version field (e.g. in package.json). Skips `[Unreleased]`,
// which never has a version number.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function getAppVersion() {
  const changelog = readFileSync(path.join(__dirname, '../../CHANGELOG.md'), 'utf8')
  const match = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)
  return match?.[1] ?? '0.0.0'
}
