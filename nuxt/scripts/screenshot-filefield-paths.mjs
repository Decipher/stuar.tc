#!/usr/bin/env node
// Captures admin-UI screenshots for the File (Field) Paths release post from a
// live local Drupal instance, so the shots can be regenerated when the module
// changes rather than being a one-off. Sibling of screenshot-story.mjs, which
// drives the Custom Formatters admin screens; per
// wiki/screenshot-conventions.md, a post that needs different targets gets its
// own script rather than another pile of flags on that one.
//
// The instance is the module's own drupal_extension_scaffold build (Drupal 11
// on the PHP built-in server, SQLite, no Docker), not the site's drupal/
// backend:
//
//   git clone <filefield_paths> && cd filefield_paths && make build
//   cd build
//   ./vendor/bin/drush --uri=http://localhost:8000 pm:install token pathauto redirect
//   ./vendor/bin/drush --uri=http://localhost:8000 recipe "$PWD/web/core/recipes/article_content_type"
//   # then set a File (Field) Paths pattern on node.article.field_image
//   ./vendor/bin/drush --uri=http://localhost:8000 user:login
//
// `vendor/bin/drush` is a bash wrapper: run it directly, never as
// `php vendor/bin/drush`, which prints the wrapper and exits 0.
//
// Authentication: a `drush user:login` link is single-use, so the first run
// against a fresh site must pass --login-url; the session is then saved to a
// Playwright storageState file (gitignored) and reused.
//
// Usage:
//   node scripts/screenshot-filefield-paths.mjs \
//     --base-url=http://localhost:8000 \
//     --login-url="http://localhost:8000/user/reset/1/.../login"
//
//   # Re-run one shot against a still-running instance:
//   node scripts/screenshot-filefield-paths.mjs --target=filefield-paths-10-field-settings.png

import { mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'http://localhost:8000',
  outDir: path.join(__dirname, '../public/images/writing'),
  loginUrl: '',
  storageState: path.join(__dirname, '.auth/filefield-paths-state.json'),
  // Matches the `desktop` visual-regression project in playwright.config.ts.
  viewportWidth: '1280',
  viewportHeight: '900',
  // Limit the run to a single output filename. '' runs every target.
  target: '',
}

/**
 * Parse --key=value CLI args into an options object (camelCased keys).
 *
 * @param {string[]} argv - The argv slice (usually process.argv.slice(2)).
 * @returns {Record<string, string>} Parsed options merged with defaults.
 */
function parseArgs(argv) {
  const args = { ...DEFAULTS }
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg)
    if (!match) continue
    const key = match[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (key in args) args[key] = match[2]
  }
  return args
}

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------
// Drupal's AJAX rebuilds append a unique suffix to element `id`s, so
// `data-drupal-selector` attributes are used instead of `#id` throughout.
// `selectors` is an ordered list of candidates: the first one that resolves to
// a visible box wins, and the script reports which. That keeps a shot working
// across a Drupal minor that renames a wrapper, instead of failing with
// "no visible element" and leaving the reason to guesswork.
const TARGETS = [
  {
    file: 'filefield-paths-10-field-settings.png',
    route: '/admin/structure/types/manage/article/fields/node.article.field_image',
    // The form builds a container and a nested <details> that both carry
    // `#parents => ['third_party_settings','filefield_paths']`, so both render
    // the same data-drupal-selector (Drupal suffixes the duplicate `id`, not
    // the selector). The outer div is the one worth capturing: it holds the
    // "Enable File (Field) Paths?" checkbox as well as the details.
    selectors: [
      'div[data-drupal-selector="edit-third-party-settings-filefield-paths"]',
      '#edit-third-party-settings-filefield-paths',
      '[data-drupal-selector="edit-third-party-settings-filefield-paths"]',
    ],
    // 20px rather than the 32px default: the container sits directly under the
    // previous field's description, and 32px pulls a clipped line of it into
    // the top of the shot.
    padding: 20,
    // The settings live in a collapsed <details>. Open that one only. The two
    // per-field "options" sub-details stay shut on purpose: opened, they add
    // six checkbox rows and 600px of height for material the post does not
    // discuss, and the shot is about the patterns.
    async prepare(page) {
      await page.evaluate(() => {
        for (const d of document.querySelectorAll('details')) {
          const summary = d.querySelector('summary')?.textContent ?? ''
          if (/File \(Field\) Path settings/.test(summary)) d.open = true
          if (/File path options|File name options/.test(summary)) d.open = false
        }
      })
      await page.waitForTimeout(300)
    },
  },
  {
    file: 'filefield-paths-10-temporary-location.png',
    route: '/admin/config/media/file-system/filefield-paths',
    selectors: [
      '[data-drupal-selector="filefield-paths-settings-form"]',
      'form.filefield-paths-settings-form',
      '#block-claro-content form',
      'main form',
    ],
  },
]

// Admin toolbars are fixed-position and overlay the top of a clipped capture.
const HIDE_FIXED_CHROME_CSS = `
  #toolbar-administration, #gin-toolbar-bar, .region-sticky-watcher,
  .region.region-sticky, .sticky-shadow, .toolbar-oria, #toolbar-item-administration-tray {
    display: none !important;
  }
`

// ---------------------------------------------------------------------------
// PNG helpers
// ---------------------------------------------------------------------------

/**
 * Read width/height out of a PNG buffer's IHDR chunk, so the run summary can
 * report exact on-disk dimensions without adding a dependency.
 *
 * @param {Buffer} buffer - A full PNG file buffer.
 * @returns {{width: number, height: number}} Pixel dimensions.
 */
function pngDimensions(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

/**
 * Format a byte count for the run summary.
 *
 * @param {number} bytes - Size in bytes.
 * @returns {string} Human-readable size.
 */
function formatSize(bytes) {
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`
}

/**
 * Screenshot one element with padding around it.
 *
 * Scroll is reset first: a stale scroll position yields a negative bounding-box
 * origin and silently truncates the shot. The viewport is grown to fit the
 * padded clip because `page.screenshot({ clip })` is viewport-bounded.
 *
 * @param {import('@playwright/test').Page} page - The active page.
 * @param {string} selector - CSS selector for the element to capture.
 * @param {string} outPath - Absolute path to write the PNG to.
 * @param {{padding?: number}} [options] - Padding in CSS pixels (default 32).
 * @returns {Promise<{file: string, width: number, height: number, bytes: number}>} Capture result.
 */
async function screenshotElement(page, selector, outPath, { padding = 32 } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0))

  const box = await page.locator(selector).first().boundingBox()
  if (!box) throw new Error(`screenshotElement: no visible element for selector "${selector}"`)

  const x = Math.max(0, box.x - padding)
  const y = Math.max(0, box.y - padding)
  const clip = {
    x,
    y,
    // Add the padding back on the near edge even where x/y clamped to 0, so an
    // element close to the page edge is not shorted on the other side.
    width: box.width + (box.x - x) + padding,
    height: box.height + (box.y - y) + padding,
  }

  const original = page.viewportSize()
  await page.setViewportSize({
    width: Math.max(original?.width ?? 0, Math.ceil(clip.x + clip.width)),
    height: Math.max(original?.height ?? 0, Math.ceil(clip.y + clip.height)),
  })
  const buffer = await page.screenshot({ clip })
  if (original) await page.setViewportSize(original)

  await writeFile(outPath, buffer)
  const { size } = await stat(outPath)
  const { width, height } = pngDimensions(buffer)
  return { file: path.basename(outPath), width, height, bytes: size }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Authenticate a browser context, either by consuming a one-time login URL and
 * persisting the session, or by reusing a saved storageState.
 *
 * @param {import('@playwright/test').Browser} browser - Launched browser.
 * @param {{width: number, height: number}} viewport - Viewport size.
 * @param {string} loginUrl - A `drush user:login` one-time URL, or ''.
 * @param {string} storageStatePath - Where to read/write session state.
 * @returns {Promise<import('@playwright/test').BrowserContext>} An authenticated context.
 */
async function authenticate(browser, viewport, loginUrl, storageStatePath) {
  if (loginUrl) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto(loginUrl, { waitUntil: 'networkidle' })
    // Drupal 10/11 land on a one-time-login page with a "Log in" submit.
    const submit = page.locator('input[type="submit"][value="Log in"], button:has-text("Log in")')
    if (await submit.count()) {
      await submit.first().click()
      await page.waitForLoadState('networkidle')
    }
    await mkdir(path.dirname(storageStatePath), { recursive: true })
    await context.storageState({ path: storageStatePath })
    await page.close()
    console.log(`screenshot-filefield-paths: logged in, session saved to ${storageStatePath}`)
    return context
  }

  if (!existsSync(storageStatePath)) {
    throw new Error(
      `No saved session at ${storageStatePath}. Pass --login-url with a fresh `
      + `\`drush user:login\` link on the first run.`,
    )
  }
  return browser.newContext({ viewport, storageState: storageStatePath })
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * Visit each target route and capture its screenshot.
 *
 * @param {import('@playwright/test').BrowserContext} context - Authenticated context.
 * @param {string} baseUrl - Drupal base URL.
 * @param {string} outDir - Directory to write PNGs into.
 * @param {string} target - Optional single filename to limit the run to.
 * @returns {Promise<Array<{file: string, width: number, height: number, bytes: number}>>} Results.
 */
async function capture(context, baseUrl, outDir, target = '') {
  await mkdir(outDir, { recursive: true })
  const page = await context.newPage()
  const results = []

  for (const { route, file, selectors, prepare, padding } of TARGETS) {
    if (target && file !== target) continue

    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })

    // A shot of an access-denied or error page is worse than no shot: it looks
    // plausible at a glance and only fails review. Refuse it outright.
    const heading = (await page.locator('h1').first().textContent().catch(() => '')) ?? ''
    if (/Access denied|Page not found|The website encountered an unexpected error/i.test(heading)) {
      throw new Error(`${file}: ${route} rendered "${heading.trim()}" - check auth and that the module is enabled`)
    }

    if (prepare) await prepare(page)
    await page.addStyleTag({ content: HIDE_FIXED_CHROME_CSS })
    await page.waitForTimeout(200)

    let used = null
    for (const selector of selectors) {
      if (await page.locator(selector).count() && await page.locator(selector).first().boundingBox()) {
        used = selector
        break
      }
    }
    if (!used) {
      throw new Error(`${file}: none of ${JSON.stringify(selectors)} resolved on ${route}`)
    }
    console.log(`screenshot-filefield-paths: ${file} via ${used}`)

    results.push(await screenshotElement(page, used, path.join(outDir, file), padding ? { padding } : {}))
  }

  await page.close()
  return results
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const viewport = { width: Number(args.viewportWidth), height: Number(args.viewportHeight) }
  const outDir = path.resolve(args.outDir)
  const storageStatePath = path.resolve(args.storageState)

  console.log(`screenshot-filefield-paths: base URL ${args.baseUrl}, viewport ${viewport.width}x${viewport.height}`)

  const browser = await chromium.launch()
  try {
    const context = await authenticate(browser, viewport, args.loginUrl, storageStatePath)
    const results = await capture(context, args.baseUrl, outDir, args.target)
    console.log(`\nscreenshot-filefield-paths: saved ${results.length} screenshot(s) to ${outDir}`)
    for (const { file, width, height, bytes } of results) {
      console.log(`  - ${file} (${width}x${height}, ${formatSize(bytes)})`)
    }
  } finally {
    await browser.close()
  }
}

// Guarded so the file can be imported without reaching for a live Drupal.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
