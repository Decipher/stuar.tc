#!/usr/bin/env node
/**
 * Compares the live site against the design baselines checked in at
 * tests/visual/design-reference/ (sourced from the design handoff zip's
 * visual-baselines/ folder — see manifest.json for provenance).
 *
 * This is a human-review tool, not a CI gate: full-page pixel diffs against
 * a mockup will always show noise from real vs. placeholder content, so
 * results land in test-results/design-diff/ for eyeballing rather than
 * asserting pass/fail. It exists to catch structural/visual drift (broken
 * layout, wrong colours, missing nav items) the way the unit/component
 * tests can't.
 *
 * Usage: node tests/visual/compare-design.mjs [baseURL]
 */
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const baseURL = process.argv[2] ?? 'http://localhost:3000'
const refDir = join(__dirname, 'design-reference')
const outDir = join(__dirname, '..', '..', 'test-results', 'design-diff')
mkdirSync(outDir, { recursive: true })

const pages = [
  { subject: 'home', path: '/' },
  { subject: 'about', path: '/about' },
  { subject: 'opensource', path: '/open-source' },
  { subject: 'writing', path: '/writing' },
  { subject: 'article', path: '/writing/hello-world-20211126' },
  { subject: 'photography', path: '/photos' },
]
const breakpoints = [375, 768, 1280, 1680]

const browser = await chromium.launch()
for (const { subject, path } of pages) {
  for (const width of breakpoints) {
    const refFile = join(refDir, `${subject}__${width}w.png`)
    if (!existsSync(refFile)) continue

    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(baseURL + path)
    await page.waitForLoadState('networkidle')
    const actualFile = join(outDir, `${subject}__${width}w-actual.png`)
    await page.screenshot({ path: actualFile, fullPage: true })
    await page.close()

    const diffFile = join(outDir, `${subject}__${width}w-diff.png`)
    try {
      execFileSync('compare', [
        '-metric', 'AE',
        refFile,
        actualFile,
        diffFile,
      ], { stdio: ['ignore', 'ignore', 'pipe'] })
    }
    catch (err) {
      // ImageMagick `compare` exits non-zero whenever any pixels differ —
      // that's expected, the diff image is still written. Only the AE count
      // (printed to stderr) is interesting, and a missing diffFile means a
      // real failure (e.g. size mismatch).
      const ae = err.stderr?.toString().trim()
      console.log(`${subject}@${width}w: AE=${ae ?? 'error (see ' + diffFile + ')'}`)
      continue
    }
    console.log(`${subject}@${width}w: identical`)
  }
}
await browser.close()
console.log(`\nDiff images written to ${outDir}`)
