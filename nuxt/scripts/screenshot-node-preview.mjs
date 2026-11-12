#!/usr/bin/env node
// Captures the preview screen for the Consumer Node Preview / Druxt Node
// Preview post from a live local druxtjs.org stack, so it can be regenerated
// when either module changes. Sibling of screenshot-vale.mjs; per
// wiki/screenshot-conventions.md, a post that needs different targets gets its
// own script rather than more flags on another one.
//
// The stack is druxtjs.org's local setup: Drupal with Consumer Node Preview,
// JSON:API Node Preview (with the drupal.org/i/3367724 fixes) and a Frontend
// target pointing at the Nuxt site's /druxt/node/preview page. Drupal and Nuxt
// must share a host name (both on 127.0.0.1), or the session cookie does not
// reach the frame and the shot is a 404.
//
// The script edits a node without saving it, presses Preview, waits for the
// Frontend tab's frame to show the unsaved title, and captures the tab row
// plus the top of the frame. Nothing is saved: the edit lives only in the
// preview's tempstore.
//
// Authentication: a `drush user:login` link is single-use, so the first run
// must pass --login-url; the session is then saved to a Playwright
// storageState file (gitignored) and reused.
//
// Usage:
//   node scripts/screenshot-node-preview.mjs \
//     --base-url=http://127.0.0.1:8894 --nid=37 \
//     --login-url="http://127.0.0.1:8894/user/reset/..."
//
// The diff hero adds: --title-suffix=", from zero"
//   --paragraph-from="your first piece of content" --paragraph-to="your first page"
//   --diff=1 --layout=default --file=preview-diff.png
//
// Then, before committing: magick <file> -strip -colors 256 PNG8:<file>

import { mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'http://127.0.0.1:8894',
  nid: '37',
  outDir: path.join(__dirname, '../public/images/writing/consumer-node-preview-100-rc1-preview-fully-decoupled-drupal-sites-20261112'),
  loginUrl: '',
  storageState: path.join(__dirname, '.auth/node-preview-state.json'),
  // Appended to the node's saved title, so the shot proves the edit is unsaved.
  titleSuffix: ' (unsaved edit)',
  // Optional unsaved edit to the first docs text paragraph: replace
  // paragraphFrom with paragraphTo. Pick text the site's Vale gate accepts, or
  // Preview is refused.
  paragraphFrom: '',
  paragraphTo: '',
  // Any non-empty value switches on druxtjs.org's "Show changes against the
  // live page" toggle in the frame before the capture. Site-only, not part of
  // either module.
  diff: '',
  // A layout name from the target's list, or '' for the target's default.
  layout: '',
  file: 'preview-screen.png',
  // Matches the `desktop` visual-regression project in playwright.config.ts.
  viewportWidth: '1280',
  viewportHeight: '900',
  // How much of the frame to keep below the tab row, in CSS pixels.
  maxHeight: '760',
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

// Admin toolbars are fixed-position and overlay the top of a clipped capture.
const HIDE_FIXED_CHROME_CSS = `
  #toolbar-administration, #gin-toolbar-bar, .region-sticky-watcher,
  .region.region-sticky, .sticky-shadow, .toolbar-oria, #toolbar-item-administration-tray {
    display: none !important;
  }
`

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
 * Authenticate a browser context, either by consuming a one-time login URL and
 * persisting the session, or by reusing a saved storageState.
 *
 * @param {import('@playwright/test').Browser} browser - Launched browser.
 * @param {{width: number, height: number}} viewport - Viewport size.
 * @param {string} loginUrl - A `drush user:login` one-time URL, or ''.
 * @param {string} storageStatePath - Where to read/write session state.
 * @returns {Promise<import('@playwright/test').BrowserContext>} An authenticated context.
 * @throws {Error} When there is neither a login URL nor a saved session.
 */
async function authenticate(browser, viewport, loginUrl, storageStatePath) {
  if (loginUrl) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto(loginUrl, { waitUntil: 'networkidle' })
    const submit = page.locator('input[type="submit"][value="Log in"], button:has-text("Log in")')
    if (await submit.count()) {
      await submit.first().click()
      await page.waitForLoadState('networkidle')
    }
    await mkdir(path.dirname(storageStatePath), { recursive: true })
    await context.storageState({ path: storageStatePath })
    await page.close()
    console.log(`screenshot-node-preview: logged in, session saved to ${storageStatePath}`)
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

/**
 * Edit the node's title without saving, press Preview, and wait until the
 * Frontend tab's frame renders the unsaved title.
 *
 * @param {import('@playwright/test').Page} page - The active page.
 * @param {Record<string, string>} args - Parsed options.
 * @returns {Promise<string>} The unsaved title the frame shows.
 * @throws {Error} When the edit form, the preview screen or the frame fails.
 */
async function openPreview(page, args) {
  await page.goto(`${args.baseUrl}/node/${args.nid}/edit`, { waitUntil: 'networkidle' })
  const title = page.locator('[data-drupal-selector="edit-title-0-value"]')
  if (!await title.count()) {
    throw new Error(`node/${args.nid}/edit has no title field; check auth and the node ID`)
  }
  const unsaved = `${(await title.inputValue()).trim()}${args.titleSuffix}`
  await title.fill(unsaved)

  if (args.paragraphFrom) {
    // Layout Paragraphs opens the paragraph in a dialog whose body is a
    // CodeMirror 5 editor, so the edit goes through its API, then save() copies
    // it back to the textarea the form submits.
    const block = page.locator('.js-lpb-component.paragraph--type--docs-text').first()
    await block.hover()
    await block.locator('.lpb-edit, a[href*="/edit"]').first().click({ force: true })
    const dialog = page.locator('.ui-dialog')
    await dialog.waitFor({ timeout: 20000 })
    await page.waitForTimeout(3000)
    const changed = await dialog.locator('.CodeMirror').first().evaluate((el, [from, to]) => {
      const cm = el.CodeMirror
      const before = cm.getValue()
      cm.setValue(before.replace(from, to))
      cm.save()
      return cm.getValue() !== before
    }, [args.paragraphFrom, args.paragraphTo])
    if (!changed) throw new Error(`the first text paragraph has no "${args.paragraphFrom}"`)
    await page.locator('.ui-dialog-buttonpane button:has-text("Save")').first().click()
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle')
  }

  // Gin's top bar intercepts pointer events over the form actions, so a
  // Playwright click times out; a DOM click submits the same button.
  await page.locator('[data-drupal-selector="edit-preview"]').evaluate((el) => el.click())
  await page.locator('[data-consumer-node-preview]').waitFor({ timeout: 30000 })

  // Pass --layout on every run: a site whose first listed layout is the bare
  // one opens on it, so a run without --layout is not the default layout.
  if (args.layout) {
    const select = page.locator('select[data-consumer-node-preview-layout]')
    if (!await select.count()) throw new Error('--layout given, but the target has no layout picker')
    await select.selectOption(args.layout)
  }

  // The frame must show the edit. A frame that renders the saved node, a 404
  // or an origin refusal looks plausible at a glance and only fails review.
  const frame = page.frameLocator('[data-consumer-node-preview-frame]')
  await frame.getByText(unsaved, { exact: false }).first().waitFor({ timeout: 30000 })
  if (args.diff) {
    await frame.locator('[data-testid="preview-diff-toggle"]').check()
    await frame.locator('.preview-diff-toggle').getByText(/changes? from the live page/).waitFor({ timeout: 30000 })
    console.log(`screenshot-node-preview: ${await frame.locator('.preview-diff-toggle span[aria-live]').innerText()}`)
  }
  await page.waitForLoadState('networkidle')
  // Images inside the frame load after the title paints.
  await page.waitForTimeout(1500)
  return unsaved
}

/**
 * Capture the tab row and the top of the frame, clipped to maxHeight.
 *
 * @param {import('@playwright/test').Page} page - The active page.
 * @param {string} outPath - Absolute path to write the PNG to.
 * @param {number} maxHeight - Maximum clip height in CSS pixels.
 * @returns {Promise<{file: string, bytes: number}>} Capture result.
 * @throws {Error} When the preview screen has no visible box.
 */
async function capture(page, outPath, maxHeight) {
  await page.addStyleTag({ content: HIDE_FIXED_CHROME_CSS })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)

  const box = await page.locator('[data-consumer-node-preview]').boundingBox()
  if (!box) throw new Error('the preview screen has no visible box')

  const padding = 24
  const x = Math.max(0, box.x - padding)
  const y = Math.max(0, box.y - padding)
  const clip = {
    x,
    y,
    width: box.width + (box.x - x) + padding,
    height: Math.min(box.height + (box.y - y) + padding, maxHeight),
  }
  const viewport = page.viewportSize()
  await page.setViewportSize({
    width: Math.max(viewport?.width ?? 0, Math.ceil(clip.x + clip.width)),
    height: Math.max(viewport?.height ?? 0, Math.ceil(clip.y + clip.height)),
  })
  const buffer = await page.screenshot({ clip })
  await writeFile(outPath, buffer)
  const { size } = await stat(outPath)
  return { file: path.basename(outPath), bytes: size }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const viewport = { width: Number(args.viewportWidth), height: Number(args.viewportHeight) }
  const outDir = path.resolve(args.outDir)
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch()
  try {
    const context = await authenticate(browser, viewport, args.loginUrl, path.resolve(args.storageState))
    const page = await context.newPage()
    const unsaved = await openPreview(page, args)
    console.log(`screenshot-node-preview: frame shows "${unsaved}"`)
    const { file, bytes } = await capture(page, path.join(outDir, args.file), Number(args.maxHeight))
    console.log(`screenshot-node-preview: saved ${file} (${formatSize(bytes)}) to ${outDir}`)
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
