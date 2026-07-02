import { test, expect, type Page } from '@playwright/test'

/**
 * Font-normalisation + animation freeze for deterministic full-page screenshots.
 *
 * Injected AFTER navigation via `page.addStyleTag`, not `page.addInitScript`:
 * Nuxt's unhead head-management drops init-injected <style> nodes during
 * hydration, so an init script is silently undone before the screenshot fires.
 *
 * Capture fonts are normalised to deterministic OS fonts (DejaVu Sans/Mono on
 * the Debian runner) by overriding the design tokens --font-sans/--font-mono.
 * This removes the web-font-loading race that made phone (375px) flake:
 * @nuxt/fonts fetches Archivo/JetBrains Mono at runtime, and whether every woff2
 * subset has settled before the screenshot fires is non-deterministic. At narrow
 * widths a single wrap-point shift (fallback vs web font) accumulates into
 * ~24-32px of full-page height variance. Mirrors the @stuartclark/ui
 * playground-visual suite.
 */
const FREEZE_CSS = [
  // Kill animations, transitions and the caret so nothing time-based moves.
  '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  // Override the design tokens to deterministic OS fonts.
  ':root{--font-sans:ui-sans-serif,system-ui,"DejaVu Sans",sans-serif;--font-mono:ui-monospace,"DejaVu Sans Mono",monospace}',
  // Belt-and-suspenders: pin elements that set font-family directly.
  'html,body,div,span,p,h1,h2,h3,h4,h5,h6,li,td,th,label,button,a,blockquote,figcaption,caption{font-family:ui-sans-serif,system-ui,"DejaVu Sans",sans-serif!important}',
  'code,pre,kbd,samp{font-family:ui-monospace,"DejaVu Sans Mono",monospace!important}',
].join('')

/** Navigate to a page and stabilise it (freeze + font-normalise) for capture. */
async function gotoSnapshot(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  // Inject AFTER hydration so unhead doesn't strip it.
  await page.addStyleTag({ content: FREEZE_CSS })
  await page.evaluate(() => document.fonts && document.fonts.ready)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
})

test('home page visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/')
  await expect(page).toHaveScreenshot('home.png', { fullPage: true })
})

test('about page visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/about')
  await expect(page).toHaveScreenshot('about.png', { fullPage: true })
})

test('open-source page visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/open-source')
  await expect(page).toHaveScreenshot('open-source.png', { fullPage: true })
})

test('writing index visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/writing')
  await expect(page).toHaveScreenshot('writing.png', { fullPage: true })
})

test('article detail visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/writing/hello-world')
  await expect(page).toHaveScreenshot('article.png', { fullPage: true })
})

test('styleguide visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/styleguide')
  await expect(page).toHaveScreenshot('styleguide.png', { fullPage: true })
})

test('uses page visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/uses')
  await expect(page).toHaveScreenshot('uses.png', { fullPage: true })
})

test('photos page visual regression', async ({ page }) => {
  await gotoSnapshot(page, '/photos')
  await expect(page).toHaveScreenshot('photos.png', { fullPage: true })
})
