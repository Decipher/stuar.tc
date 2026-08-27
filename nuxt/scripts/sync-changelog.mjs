#!/usr/bin/env node
// Copies the repo-root CHANGELOG.md into content/changelog.md, so the
// `changelog` collection (content.config.ts) can find it. @nuxt/content
// only scans nuxt/content/, and the real CHANGELOG.md lives one directory
// up, outside that scan root.
//
// Runs on every dev/build/generate (see the `pre*` scripts in
// package.json), so content/changelog.md always matches the real file with
// no manual step. It's gitignored, not committed — CHANGELOG.md is the only
// source of truth.

import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '../../CHANGELOG.md')
const DEST = path.join(__dirname, '../content/changelog.md')

async function main() {
  await mkdir(path.dirname(DEST), { recursive: true })
  await copyFile(SRC, DEST)
  console.log(`sync-changelog: copied ${path.relative(process.cwd(), SRC)} -> ${path.relative(process.cwd(), DEST)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
