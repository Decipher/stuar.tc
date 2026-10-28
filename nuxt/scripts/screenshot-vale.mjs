#!/usr/bin/env node
// Captures the workspace screenshot for the Vale (for Drupal) release post
// from a live local Drupal instance, so it can be regenerated when the module
// changes. Sibling of screenshot-filefield-paths.mjs; per
// wiki/screenshot-conventions.md, a post that needs different targets gets its
// own script rather than more flags on another one.
//
// The instance is the module's own drupal_extension_scaffold build (Drupal 11
// on the PHP built-in server, SQLite, no Docker):
//
//   git clone <vale> && cd vale && make build && make provision
//   cd build && ./vendor/bin/drush -l http://localhost:8000 vale:install
//   # .vale.ini beside web/ with `Packages = Microsoft` and
//   # `BasedOnStyles = Vale, Microsoft`, then `./bin/vale sync`; in
//   # settings.php, vale_binary and vale_config per the module README, plus
//   #   $config['vale.settings']['publish_only'] = TRUE;
//   #   $config['vale.settings']['workspace_mode'] = 'block';
//   # an `article` type whose body has Check with Vale on, and
//   ./vendor/bin/drush -l http://localhost:8000 en workspaces workspaces_ui
//   # with a workspace whose id is `stage`
//   ./vendor/bin/drush -l http://localhost:8000 user:login
//
// Authentication: a `drush user:login` link is single-use, so the first run
// against a fresh site must pass --login-url; the session is then saved to a
// Playwright storageState file (gitignored) and reused.
//
// Usage:
//   node scripts/screenshot-vale.mjs \
//     --base-url=http://localhost:8000 \
//     --login-url="http://localhost:8000/user/reset/1/.../login"

import { mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'http://localhost:8000',
  outDir: path.join(__dirname, '../public/images/writing/vale-100-prose-linting-drupal-20261028'),
  loginUrl: '',
  storageState: path.join(__dirname, '.auth/vale-state.json'),
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
// A draft body with two error-level alerts (Vale.Repetition and
// Microsoft.Contractions) and a Microsoft.Adverbs warning. In publish-only
// mode the draft saves; the workspace publish is what refuses it.
const DRAFT_BODY = 'Check the the docs before you publish. It is very easy to miss a repeated word.'
const WORKSPACE = 'stage'

const TARGETS = [
  {
    file: 'vale-workspace-publish-refused.png',
    route: `/admin/config/workflow/workspaces/manage/${WORKSPACE}/activate`,
    selectors: ['[data-drupal-messages]', '.messages-list', '[role="contentinfo"]'],
    padding: 24,
    // Switch to the workspace, save a draft with findings in it, then try to
    // publish the workspace. The shot is refused unless the publish was: a
    // capture of a workspace that published would say the opposite of the
    // caption.
    async prepare(page, baseUrl) {
      const activate = page.locator('[data-drupal-selector="edit-submit"]')
      if (await activate.count()) {
        await activate.click()
        await page.waitForLoadState('networkidle')
      }

      await page.goto(`${baseUrl}/node/add/article`, { waitUntil: 'networkidle' })
      await page.fill('[data-drupal-selector="edit-title-0-value"]', 'Release notes')
      const editable = page.locator('.ck-editor__editable').first()
      await editable.click()
      await page.keyboard.type(DRAFT_BODY)
      const published = page.locator('[data-drupal-selector="edit-status-value"]')
      if (await published.count() && await published.isChecked()) await published.uncheck()
      await page.locator('[data-drupal-selector="edit-submit"]').click()
      await page.locator('.messages--status, .messages--error').first().waitFor({ timeout: 15000 })
      await page.waitForLoadState('networkidle')
      if (!/\/node\/\d+$/.test(page.url())) {
        throw new Error('vale-workspace-publish-refused.png: the draft did not save; publish_only should let it')
      }

      await page.goto(`${baseUrl}/admin/config/workflow/workspaces/manage/${WORKSPACE}/publish`, { waitUntil: 'networkidle' })
      await page.locator('[data-drupal-selector="edit-submit"]').click()
      await page.locator('.messages--error, .messages--status').first().waitFor({ timeout: 30000 })
      await page.waitForLoadState('networkidle')
      if (!await page.locator('.messages--error').count()) {
        throw new Error('vale-workspace-publish-refused.png: the publish was not refused; check workspace_mode is block')
      }
      await page.addStyleTag({ content: '.messages__button, .messages__close { display: none !important; }' })
      await page.setViewportSize({ width: 1280, height: 900 })
    },
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
    console.log(`screenshot-vale: logged in, session saved to ${storageStatePath}`)
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

    if (prepare) await prepare(page, baseUrl)
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
    console.log(`screenshot-vale: ${file} via ${used}`)

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

  console.log(`screenshot-vale: base URL ${args.baseUrl}, viewport ${viewport.width}x${viewport.height}`)

  const browser = await chromium.launch()
  try {
    const context = await authenticate(browser, viewport, args.loginUrl, storageStatePath)
    const results = await capture(context, args.baseUrl, outDir, args.target)
    console.log(`\nscreenshot-vale: saved ${results.length} screenshot(s) to ${outDir}`)
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
