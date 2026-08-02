#!/usr/bin/env node
// Captures admin-UI screenshots from a live local Drupal instance for a
// "writing" blog post — e.g. a contrib module's admin screens — so the
// shots can be regenerated whenever the module/config under review changes,
// rather than being a one-off. Pairs with sync-content.mjs/push-story.mjs
// as the third script that talks to the local drupal/ backend, but drives
// the admin UI directly with Playwright (already a project dependency —
// see playwright.config.ts) instead of JSON:API, since the thing being
// captured IS the rendered admin UI.
//
// Authentication: a `drush uli` one-time login link is single-use, so the
// first run against a fresh site must pass --login-url; the resulting
// session cookies are saved to a Playwright storageState file (default:
// scripts/.auth/storage-state.json, gitignored) and reused on every
// subsequent run until the PHP session expires or the dev server's SQLite
// DB is reset (`make reset`).
//
// Usage:
//   # First run against a fresh `make build` — consumes the one-time link
//   # printed by `make login` (run from drupal/):
//   node scripts/screenshot-story.mjs \
//     --base-url=http://127.0.0.1:8888 \
//     --login-url="http://127.0.0.1:8888/user/reset/1/.../login"
//
//   # Subsequent runs against the same still-running instance — reuses the
//   # saved session, no login URL needed:
//   node scripts/screenshot-story.mjs --base-url=http://127.0.0.1:8888
//
//   # Custom output directory:
//   node scripts/screenshot-story.mjs --out-dir=/tmp/shots

import { mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  baseUrl: 'http://127.0.0.1:8888',
  outDir: path.join(__dirname, '../public/images/writing'),
  loginUrl: '',
  storageState: path.join(__dirname, '.auth/storage-state.json'),
  // Matches the `desktop` visual-regression project in playwright.config.ts.
  viewportWidth: '1280',
  viewportHeight: '900',
  // 'all' | 'interactive' | 'both'. Lets a re-run regenerate just the
  // interactive (Preview/CodeMirror) shots without touching the plain
  // TARGETS captures that a previous run already produced and approved.
  only: 'both',
  // Limit the run to a single output filename (matched against each target's
  // `file`), regardless of `only`. Useful for regenerating one shot — e.g. the
  // autocomplete capture — without driving every interactive target. '' = no
  // filter, run everything `only` selects.
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
// Each target is an admin route + the filename to save it under. Kept as an
// explicit list (rather than derived from anything) so adding a new
// screenshot later is a one-line change.
const TARGETS = [
  { route: '/admin/structure/formatters', file: 'custom-formatters-collection.png' },
  { route: '/admin/structure/formatters/manage/example_twig_image', file: 'custom-formatters-twig-editor.png' },
  { route: '/admin/structure/formatters/add', file: 'custom-formatters-add-type.png' },
  // 4.1.0-beta3's headline feature: each Formatter config entity is a Field
  // UI bundle for a `formatter_setting` content entity, so core's "Manage
  // fields" tab lets you attach arbitrary fields (CSS class, a boolean link
  // toggle, etc.) to a specific formatter. `example_twig_title` ships two
  // such fields as a worked example.
  {
    route: '/admin/structure/formatters/manage/example_twig_title/fields',
    file: 'custom-formatters-settings-fields.png',
    // Crop to just the fields table — core's Field UI "Manage fields"
    // table has a stable id regardless of theme.
    selector: '#field-overview',
  },
]

// ---------------------------------------------------------------------------
// Interactive targets
// ---------------------------------------------------------------------------
// As of 4.1.0-beta3, Custom Formatters gained a "Preview" vertical tab (live
// rendering against a real/generated entity, with per-engine debug output)
// and a CodeMirror-backed code editor (requires the optional
// drupal/codemirror_editor module). Unlike TARGETS above, these need form
// interaction — cascading AJAX selects — before there's anything new to
// capture, so each target gets a `run(page)` step instead of a plain route.
//
// Stable selectors: Drupal's AJAX rebuilds append a unique suffix to element
// `id`s (e.g. `edit-preview-selects-bundle--bntTxrZvQDI`) to avoid duplicate
// IDs left behind by the replaced wrapper, so plain `#id` selectors break
// after the first AJAX round-trip. `data-drupal-selector` attributes are
// preserved across rebuilds and are used throughout instead.
const previewSelector = (name) => `[data-drupal-selector="${name}"]`

/**
 * Selects an option in a cascading AJAX select and waits for Drupal's AJAX
 * round-trip (POST request + networkidle) to finish before continuing.
 *
 * @param {import('@playwright/test').Page} page - The active page.
 * @param {string} selector - A `data-drupal-selector`-based CSS selector.
 * @param {string} value - The option value to select.
 */
async function selectAndWaitForAjax(page, selector, value) {
  await page.selectOption(selector, value)
  await page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
}

const INTERACTIVE_TARGETS = [
  {
    file: 'custom-formatters-codemirror.png',
    route: '/admin/structure/formatters/manage/example_twig_image',
    // The CodeMirror-highlighted editor renders on page load with no
    // interaction needed — nothing to do here.
    async run() {},
  },
  {
    // Demonstrates the context-aware autocomplete: typing `{{` in a Twig
    // formatter auto-triggers the variable-completion dropdown (items,
    // settings, raw_settings, entity, …). The starter template is set via
    // the CodeMirror API (purely for context above the cursor — setValue
    // deliberately doesn't fire the inputRead event the hint addon hooks),
    // then the trigger itself is typed character-by-character so the addon
    // fires for real and the dropdown is the genuine one a user would see.
    file: 'custom-formatters-autocomplete.png',
    route: '/admin/structure/formatters/manage/example_twig_image',
    // Capture the code field plus enough room below the cursor for the
    // hint dropdown, which CodeMirror anchors to the cursor line.
    selector: '.js-form-item-data',
    async run(page) {
      // The codemirror_editor module loads CodeMirror from a CDN when its
      // `cdn: true` setting is on, so the editor instance may not be ready
      // the instant networkidle fires. Poll for it rather than no-op'ing.
      await page.waitForFunction(
        () => !!document.querySelector('.CodeMirror')?.CodeMirror,
        { timeout: 20000 },
      )
      await page.evaluate(() => {
        const editor = document.querySelector('.CodeMirror').CodeMirror
        editor.setValue('{% for item in items %}\n  ')
        editor.setCursor({ line: 1, ch: 2 })
        editor.focus()
      })
      // Typing `{{` fires CodeMirror's inputRead event, which the
      // codemirror_editor integration hooks to open Twig hints.
      await page.keyboard.type('{{', { delay: 150 })
      await page.waitForSelector('.CodeMirror-hints', { timeout: 8000 })
      await page.waitForTimeout(500)
      // Log the offered completions + whether the dropdown is fully inside
      // the captured region, so a regeneration self-verifies the shot.
      const diag = await page.evaluate((sel) => {
        const hints = document.querySelector('.CodeMirror-hints')
        const field = document.querySelector(sel)
        const box = (el) => { const b = el?.getBoundingClientRect(); return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null }
        const hintsBox = box(hints)
        const fieldBox = box(field)
        const inside = hintsBox && fieldBox
          && hintsBox.y >= fieldBox.y - 32 && hintsBox.y + hintsBox.h <= fieldBox.y + fieldBox.h + 32
        return { items: [...hints?.querySelectorAll('li') ?? []].map((li) => li.textContent), hintsBox, fieldBox, inside }
      }, '.js-form-item-data')
      console.log(`screenshot-story: autocomplete offered ${diag.items.length} hints: ${JSON.stringify(diag.items)}`)
      console.log(`screenshot-story: hints ${diag.inside ? 'inside' : 'PARTLY OUTSIDE'} capture region (hints=${JSON.stringify(diag.hintsBox)} field=${JSON.stringify(diag.fieldBox)})`)
    },
  },
  {
    file: 'custom-formatters-live-preview.png',
    route: '/admin/structure/formatters/manage/example_twig_image',
    async run(page) {
      // "Preview" is the active vertical tab by default; "Debugging" is a
      // nested <details> inside it that starts collapsed.
      await page.locator('summary', { hasText: 'Debugging' }).first().click()
      await page.waitForTimeout(300)

      // Cascading selects: only Media entities have an `image`-typed field
      // on this site (field_media_image on the Image media bundle).
      await selectAndWaitForAjax(page, previewSelector('edit-preview-selects-entity-type'), 'media')
      await selectAndWaitForAjax(page, previewSelector('edit-preview-selects-bundle'), 'image')
      await selectAndWaitForAjax(page, previewSelector('edit-preview-selects-field'), 'field_media_image')

      // Enable both per-engine debug outputs (variables dump + raw HTML).
      await page.check(previewSelector('edit-preview-debug-debug-variables'))
      await page.check(previewSelector('edit-preview-debug-debug-html'))

      // The entity select has no #ajax of its own — picking "Devel generate"
      // only takes effect once the Preview button below is submitted. It is
      // always the first option whenever Devel Generate is installed and
      // supports the entity type, regardless of whether real entities with
      // the target field exist.
      await page.selectOption(previewSelector('edit-preview-selects-entity'), 'devel_generate')

      await page.locator(previewSelector('edit-preview-selects-button')).click()
      await page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 15000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(600)
    },
  },
  {
    file: 'custom-formatters-settings-manage-display.png',
    route: '/admin/structure/types/manage/article/display/default',
    // Proves the other half of the formatter-settings story: once fields are
    // attached on the "Manage fields" tab of a formatter's edit page, they
    // surface as an ordinary inline settings form wherever that formatter is
    // selectable — here, the Article content type's "Title" row (machine
    // name field_display_title, a plain string field) on Manage Display.
    // This is the standard Drupal formatter-settings gear, Field UI just
    // populates it from the formatter's own attached fields instead of a
    // fixed settingsForm().
    //
    // NOTE for future maintainers: filling this in and clicking "Update"
    // does NOT persist the values as of 4.1.0-beta3 — FormatterInterface
    // has no submitForm() hook that Field UI ever calls, so the module's
    // own CustomFormatters::submitForm() (which saves the FormatterSetting
    // entity) is dead code. The uuid still gets written into this field's
    // `formatter_setting_uuid` setting, but no entity exists to load at
    // that uuid, so the value is silently lost on save/reload. Don't click
    // Update here — capture the filled-in, still-open form, which is the
    // real (and only reliable) part of the flow.
    //
    // Cropped to just the settings sub-form itself, rather than the whole
    // Manage Display table row or even the whole <tr> — a <tr> screenshot
    // inherits the full table's column widths (sized for busier rows like
    // Category/Image that have a trailing operations column this one
    // doesn't), producing a wide image with dead space on the right. This
    // div's own "Format settings: <formatter label>" heading already names
    // the field and formatter, so nothing meaningful is lost.
    selector: '[data-drupal-selector="edit-fields-field-display-title-settings-edit-form"]',
    async run(page) {
      await selectAndWaitForAjax(page, '#edit-fields-field-display-title-type', 'custom_formatters:example_twig_title')
      await page.locator('.field-plugin-settings-edit').first().click()
      await page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 15000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(400)

      await page.locator('[data-drupal-selector="edit-field-css-class-0-value"]').fill('text-lg')
      await page.locator('[data-drupal-selector="edit-field-link-value"]').check()
      await page.waitForTimeout(200)
    },
  },
  {
    // The centerpiece image for the formatter-settings section: proves, in
    // one shot, that a field attached via "Manage fields" (top half) really
    // does reach the Twig template as `settings`/`raw_settings` and produce
    // real rendered output (bottom half) — not a UI mockup and not empty
    // values. Composited from two pieces of the *same* real, live-rendered
    // page (see run() below) rather than the full formatter edit form,
    // which — screenshotted as-is — buries both halves under an unrelated
    // name/description/field-type form, an "Available parameters" reference
    // block, and the page chrome.
    file: 'custom-formatters-settings-hero.png',
    route: '/admin/structure/formatters/manage/example_twig_title',
    selector: '#hero-container',
    // The formatter's own "Preview" tab is the reliable way to see settings
    // values actually reach the Twig template: it builds an ephemeral,
    // never-saved FormatterSetting entity straight from the form input on
    // every preview request (FormatterForm::extractPreviewSettings()), so
    // it is unaffected by the Manage Display persistence bug documented
    // above. Picking a real Article node (rather than Devel Generate)
    // means the field value being formatted ("Hello world") is real too.
    //
    // IMPORTANT — "Link to entity" only renders without erroring because
    // web/sites/default/settings.local.php (gitignored, local-only) adds
    // `toUrl` to `twig_sandbox_allowed_methods`. As shipped, the example's
    // `entity.toUrl('canonical').toString()` call is rejected by Drupal
    // core's default Twig sandbox policy (only id/label/bundle/get/
    // __toString/toString are allowed on arbitrary objects) — any site
    // actually using this example hits the same wall. See the settings.php
    // comment for the full explanation; worth fixing upstream in the
    // module or its docs.
    async run(page) {
      await selectAndWaitForAjax(page, previewSelector('edit-preview-selects-entity-type'), 'node')
      await selectAndWaitForAjax(page, previewSelector('edit-preview-selects-bundle'), 'article')
      await selectAndWaitForAjax(page, previewSelector('edit-preview-selects-field'), 'field_display_title')

      // No #ajax on the entity select itself — see the note on
      // edit-preview-selects-entity above. Node 1 ("Hello world") is a
      // stable dev-content fixture with a real field_display_title value.
      await page.selectOption(previewSelector('edit-preview-selects-entity'), '1')

      await page.locator('summary', { hasText: 'Debugging' }).first().click()
      await page.waitForTimeout(300)
      await page.check(previewSelector('edit-preview-debug-debug-variables'))
      await page.check(previewSelector('edit-preview-debug-debug-html'))

      // Fill the Preview panel's own inline "Formatter settings" fieldset —
      // built from the same attached fields as the Manage Display gear, but
      // scoped to this preview request only.
      await page.locator('input[name="preview[settings][field_css_class][0][value]"]').fill('text-lg')
      await page.locator('input[name="preview[settings][field_link][value]"]').check()

      await page.locator(previewSelector('edit-preview-selects-button')).click()
      await page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 15000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(600)

      // The "Output template variables" debug dump (Symfony VarDumper) is
      // collapsed by default; open just the `settings` node (and its nested
      // `_raw`) so the real values are visible in the screenshot. Naively
      // expanding every `.sf-dump-compact` node also unfolds the full
      // `items`/`entity` object graphs (FieldItemList, the entire Node
      // entity, its FieldConfig/FieldStorageConfig...), producing a
      // multi-thousand-pixel screenshot — and matching on text content
      // (e.g. "contains field_css_class") isn't safe either, since a
      // field's generic `#settings` property (unrelated to this module)
      // appears deep inside that same object graph. Real `.click()` calls
      // on just the top-level `settings` key's toggle, scoped with `:scope
      // >` to each dump's own root <samp> so nested same-named keys several
      // levels down are never matched, keep the screenshot to only what
      // matters.
      await page.evaluate(() => {
        const clickTopLevelKeyToggle = (rootSamp, keyText) => {
          for (const span of rootSamp.querySelectorAll(':scope > span.sf-dump-key')) {
            if (span.textContent !== keyText) continue
            let el = span.nextElementSibling
            while (el && el.tagName !== 'A') el = el.nextElementSibling
            if (el) {
              el.click()
              return el.nextElementSibling // the now-expanded <samp>, for the caller to recurse into
            }
          }
          return null
        }

        for (const dump of document.querySelectorAll('.sf-dump')) {
          if (!dump.textContent.includes('field_css_class')) continue
          const settingsSamp = clickTopLevelKeyToggle(dump.querySelector(':scope > samp'), 'settings')
          if (settingsSamp) clickTopLevelKeyToggle(settingsSamp, '_raw')
          break
        }
      })
      await page.waitForTimeout(300)

      // Build the hero container: the code editor (template source) above
      // the Preview pane (selects, settings, real output, debug dump),
      // with everything else on the page — toolbar, breadcrumbs, tabs,
      // formatter name/description, the "Available parameters" reference
      // block, save buttons — discarded. Both pieces are cloned from the
      // real, already-rendered page, not reconstructed, so what ends up in
      // the screenshot is exactly what a user seeing this page would see.
      await page.evaluate(() => {
        const codeField = document.querySelector('.js-form-item-data').cloneNode(true)
        codeField.querySelector('.form-item__description')?.remove()

        const previewPane = document.querySelector('#edit-preview').cloneNode(true)
        previewPane.style.display = 'block'
        // The entity <select> has no #ajax of its own (see the note above
        // on edit-preview-selects-entity), so Playwright's selectOption()
        // only ever set it as a live DOM property, never baked into the
        // HTML as a `selected` attribute — cloneNode() copies markup, not
        // that runtime-only state, so without this it reverts to whatever
        // option is first in the list. Re-apply it on the clone.
        const entitySelect = previewPane.querySelector('[data-drupal-selector="edit-preview-selects-entity"]')
        if (entitySelect) entitySelect.value = '1'

        const heading = (text) => {
          const h = document.createElement('h3')
          h.textContent = text
          h.style.cssText = 'font:600 16px/1.4 sans-serif; margin:0 0 8px; color:#111'
          return h
        }

        const hero = document.createElement('div')
        hero.id = 'hero-container'
        hero.style.cssText = 'max-width:1280px; padding:24px; background:#fff'
        hero.appendChild(heading('Twig template — references settings.field_css_class / settings.field_link'))
        hero.appendChild(codeField)
        hero.appendChild(heading('Live preview — real rendered output, plus the settings/raw_settings debug dump'))
        Object.assign(hero.appendChild(previewPane).style, { marginTop: '28px' })

        document.body.innerHTML = ''
        document.body.style.margin = '0'
        document.body.appendChild(hero)
      })
      await page.waitForTimeout(300)
    },
  },
]

// Drupal admin themes (Claro/Gin) pin the toolbar with `position: fixed` /
// `sticky`. Chromium's `fullPage` screenshot stitches together multiple
// scrolled captures on tall pages, and a fixed/sticky element gets re-drawn
// into every segment it's visible in — producing a duplicated toolbar strip
// partway down the image. The interactive targets above render a much
// taller page (the Preview panel plus two debug-output blocks) than the
// simple TARGETS routes, tall enough to trigger this. Hiding the chrome
// before the screenshot avoids it; it isn't applied to the plain TARGETS
// capture path since those pages are short enough not to need it.
const HIDE_FIXED_CHROME_CSS = `
  #toolbar-administration, #gin-toolbar-bar, .region-sticky-watcher,
  .region.region-sticky, .sticky-shadow, #coffee-bg {
    display: none !important;
  }
`

// ---------------------------------------------------------------------------
// PNG helpers
// ---------------------------------------------------------------------------

/**
 * Read the width/height out of a PNG buffer's IHDR chunk, so the summary
 * can report exact on-disk pixel dimensions without a new dependency.
 *
 * @param {Buffer} buffer - A full PNG file buffer.
 * @returns {{width: number, height: number}} Pixel dimensions.
 */
function pngDimensions(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

/**
 * Format a byte count as a human-readable KB string.
 *
 * @param {number} bytes - Size in bytes.
 * @returns {string} e.g. "84.2 KB".
 */
function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

/**
 * Screenshot one element plus a comfortable margin of surrounding page —
 * not cropped flush to its edges — and write it straight to disk. This is
 * the standard way every selector-scoped shot in this script is captured;
 * reach for it instead of `locator.screenshot()` any time a new target
 * needs to crop to part of a page rather than the full viewport.
 *
 * Two non-obvious things this handles that a bare `locator.screenshot()`
 * (or a hand-rolled `page.screenshot({clip})`) does not:
 *
 * - Leftover scroll position: after driving AJAX interactions (clicking
 *   deep into a form, submitting a Preview button far down the page), the
 *   page is often scrolled well past the target element. `boundingBox()`
 *   is viewport-relative, so measuring without resetting scroll first can
 *   yield a negative y and a silently truncated capture.
 * - `page.screenshot({clip})` is bounded by the *current* viewport — a
 *   clip rect taller than the viewport gets cut off rather than capturing
 *   the full element, unlike `locator.screenshot()`. This grows the
 *   viewport to fit the padded clip before capturing, then restores it.
 *
 * @param {import('@playwright/test').Page} page - The active page.
 * @param {string} selector - CSS selector (Playwright's extended engine,
 *   e.g. `:has-text()`, is fine) for the element to capture.
 * @param {string} outPath - Full path (directory + filename) to write the
 *   PNG to.
 * @param {{padding?: number}} [options] - `padding`: pixels of
 *   surrounding page to include on each side (default 32).
 * @returns {Promise<{file: string, width: number, height: number, bytes: number}>}
 *   Summary row, in the same shape used elsewhere in this script.
 * @throws {Error} If the selector doesn't match a visible element.
 */
async function screenshotElement(page, selector, outPath, { padding = 32 } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0))

  const locator = page.locator(selector)
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error(`screenshotElement: no visible element for selector "${selector}"`)
  }
  const x = Math.max(0, box.x - padding)
  const y = Math.max(0, box.y - padding)
  const clip = {
    x,
    y,
    // Add padding back on the near edge even where x/y got clamped to 0,
    // so a corner-adjacent element isn't shorted just because it's close
    // to the page edge on one side.
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
 * Authenticate a browser context: either consume a one-time `drush uli`
 * login URL and persist the resulting session to `storageStatePath`, or
 * (if no login URL is given) load a previously-saved session.
 *
 * @param {import('@playwright/test').Browser} browser - Launched browser.
 * @param {{width: number, height: number}} viewport - Viewport size.
 * @param {string} loginUrl - One-time login URL, or '' to reuse storage state.
 * @param {string} storageStatePath - Path to read/write the storage state.
 * @returns {Promise<import('@playwright/test').BrowserContext>} Authenticated context.
 * @throws {Error} If no login URL is given and no storage state file exists,
 *   or if the login URL doesn't actually authenticate (e.g. already used).
 */
async function authenticate(browser, viewport, loginUrl, storageStatePath) {
  if (loginUrl) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    console.log('screenshot-story: consuming one-time login URL...')
    await page.goto(loginUrl, { waitUntil: 'networkidle' })
    if (/\/user\/login/.test(page.url())) {
      throw new Error(
        `Login did not appear to succeed — landed on ${page.url()}. ` +
        `The link is single-use — if it was already consumed, run 'make login' again for a fresh one.`,
      )
    }
    await mkdir(path.dirname(storageStatePath), { recursive: true })
    await context.storageState({ path: storageStatePath })
    console.log(`screenshot-story: authenticated as ${await page.title()}; saved session to ${storageStatePath}`)
    await page.close()
    return context
  }

  if (!existsSync(storageStatePath)) {
    throw new Error(
      `No --login-url given and no saved session at ${storageStatePath}. ` +
      `Run 'make login' in drupal/ and pass --login-url="<url>" once to bootstrap a session.`,
    )
  }
  console.log(`screenshot-story: reusing saved session from ${storageStatePath}`)
  return browser.newContext({ viewport, storageState: storageStatePath })
}

// ---------------------------------------------------------------------------
// Screenshots
// ---------------------------------------------------------------------------

/**
 * Navigate to each target route and save a full-page PNG screenshot.
 *
 * @param {import('@playwright/test').BrowserContext} context - Authenticated context.
 * @param {string} baseUrl - The Drupal base URL.
 * @param {string} outDir - Directory to save PNGs into.
 * @returns {Promise<{file: string, width: number, height: number, bytes: number}[]>} Summary rows.
 * @throws {Error} If the session turns out not to be authenticated for a route.
 */
async function captureAll(context, baseUrl, outDir, target = '') {
  await mkdir(outDir, { recursive: true })
  const page = await context.newPage()
  const results = []

  for (const { route, file, selector } of TARGETS) {
    if (target && file !== target) continue
    const url = `${baseUrl}${route}`
    console.log(`screenshot-story: capturing ${route} -> ${file}`)
    await page.goto(url, { waitUntil: 'networkidle' })
    if (/\/user\/login/.test(page.url())) {
      throw new Error(`Session is not authenticated — landed on ${page.url()} while requesting ${route}. Re-run with a fresh --login-url.`)
    }
    const outPath = path.join(outDir, file)
    // `selector`, when given, scopes the capture to one element plus a
    // margin (e.g. just a table) instead of the full page — keeps
    // screenshots destined for the blog post readable at normal size
    // instead of including the admin toolbar, breadcrumbs, and tabs above
    // the actually-relevant content. See screenshotElement() for why this
    // isn't just `locator.screenshot()`.
    if (selector) {
      results.push(await screenshotElement(page, selector, outPath))
      continue
    }
    const buffer = await page.screenshot({ fullPage: true })
    await writeFile(outPath, buffer)
    const { size } = await stat(outPath)
    const { width, height } = pngDimensions(buffer)
    results.push({ file, width, height, bytes: size })
  }

  await page.close()
  return results
}

/**
 * Navigate to each interactive target's route, run its `run(page)` step to
 * drive the AJAX form into the state worth capturing, hide fixed/sticky
 * chrome to avoid the stitching artifact described above, then save a
 * full-page PNG screenshot.
 *
 * @param {import('@playwright/test').BrowserContext} context - Authenticated context.
 * @param {string} baseUrl - The Drupal base URL.
 * @param {string} outDir - Directory to save PNGs into.
 * @returns {Promise<{file: string, width: number, height: number, bytes: number}[]>} Summary rows.
 * @throws {Error} If the session turns out not to be authenticated for a route.
 */
async function captureInteractive(context, baseUrl, outDir, target = '') {
  await mkdir(outDir, { recursive: true })
  const page = await context.newPage()
  const results = []

  for (const { route, file, run, selector } of INTERACTIVE_TARGETS) {
    if (target && file !== target) continue
    const url = `${baseUrl}${route}`
    console.log(`screenshot-story: capturing (interactive) ${route} -> ${file}`)
    await page.goto(url, { waitUntil: 'networkidle' })
    if (/\/user\/login/.test(page.url())) {
      throw new Error(`Session is not authenticated — landed on ${page.url()} while requesting ${route}. Re-run with a fresh --login-url.`)
    }
    await run(page)
    await page.addStyleTag({ content: HIDE_FIXED_CHROME_CSS })
    await page.waitForTimeout(200)
    const outPath = path.join(outDir, file)
    // See the `selector` comment in captureAll() above — same idea, but
    // some interactive targets build their own throwaway container (e.g.
    // the settings hero shot below) rather than pointing at existing markup.
    if (selector) {
      results.push(await screenshotElement(page, selector, outPath))
      continue
    }
    const buffer = await page.screenshot({ fullPage: true })
    await writeFile(outPath, buffer)
    const { size } = await stat(outPath)
    const { width, height } = pngDimensions(buffer)
    results.push({ file, width, height, bytes: size })
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

  console.log(`screenshot-story: base URL ${args.baseUrl}, viewport ${viewport.width}x${viewport.height}`)

  const browser = await chromium.launch()
  try {
    const context = await authenticate(browser, viewport, args.loginUrl, storageStatePath)
    const results = [
      ...(args.only !== 'interactive' ? await captureAll(context, args.baseUrl, outDir, args.target) : []),
      ...(args.only !== 'all' ? await captureInteractive(context, args.baseUrl, outDir, args.target) : []),
    ]

    console.log(`\nscreenshot-story: saved ${results.length} screenshot(s) to ${outDir}`)
    for (const { file, width, height, bytes } of results) {
      console.log(`  - ${file} (${width}x${height}, ${formatSize(bytes)})`)
    }
  } finally {
    await browser.close()
  }
}

// Guarded so this file can be imported (e.g. for a future test) without
// immediately trying to reach a live Drupal instance — only runs main()
// when executed directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
