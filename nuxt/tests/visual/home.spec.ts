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
  // Blank external <img> so captures don't depend on remote content;
  // visibility:hidden reserves the box so layout is stable.
  'img{visibility:hidden!important}',
].join('')

// 1x1 transparent GIF: stand in for every external image so no request
// reaches the network and no broken-image glyph is rendered.
// cspell:disable-next-line
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64')

/**
 * Block live/dynamic content for deterministic captures: the served site
 * (localhost) loads as normal, external images are fulfilled with a
 * transparent pixel, and external API calls (drupal.org, api.github.com,
 * npm registries) are aborted so every composable renders its static
 * fallback.
 */
async function blockDynamicContent(page: Page) {
  await page.route('**/*', route => {
    const req = route.request()
    const url = req.url()
    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(url)) return route.continue()
    if (req.resourceType() === 'image') return route.fulfill({ status: 200, contentType: 'image/gif', body: PIXEL_GIF })
    // cspell:disable-next-line
    return route.abort('blockedbyclient')
  })
}

/**
 * Mask live API data baked into the static HTML so baselines are
 * deterministic regardless of when ``nuxt generate`` ran.
 *
 * The build step fetches live data (drupal.org, GitHub, npm) at build time
 * and serialises it into the page payload.  ``blockDynamicContent`` only
 * prevents client-side re-fetches — the build-time values persist in the
 * DOM.  This function replaces every value that depends on an external API
 * with a fixed placeholder after hydration, before the screenshot fires.
 */
async function freezeDynamicContent(page: Page) {
  await page.evaluate(() => {
    // StatBlock values (home + about StatBand).
    document.querySelectorAll(
      '.font-mono.text-3xl.font-bold.tracking-tighter.text-highlighted',
    ).forEach(el => {
      if (/\d/.test(el.textContent || '')) el.textContent = '######'
    })

    // About-page bio: inline FFP count ("It runs on 31,546+ sites.").
    document.querySelectorAll('p').forEach(p => {
      if (/runs on/.test(p.textContent || '')) {
        p.innerHTML = p.innerHTML.replace(
          /runs on\s+[\d,]+\+?\s+sites/,
          'runs on ###### sites',
        )
      }
    })

    // ProjectCard meta — FFP site count on home "selected work" section.
    document.querySelectorAll('.font-mono.text-xs.text-dimmed').forEach(el => {
      if (/\d/.test(el.textContent || '')) el.textContent = '######'
    })

    // ProfileRow stats (OSS page ecosystem pane).
    document.querySelectorAll(
      '.whitespace-nowrap.font-mono.text-xs.text-muted',
    ).forEach(el => { el.textContent = '######' })

    // ModuleRow install counts.
    document.querySelectorAll(
      '.font-mono.text-base.font-bold.tracking-tight.text-highlighted',
    ).forEach(el => { el.textContent = '######' })

    // ModuleRow stars — preserve the ★ glyph, mask the number.
    document.querySelectorAll('.mt-0\\.5.font-mono.text-xs.text-muted').forEach(el => {
      el.innerHTML = '<span class="text-primary">★</span> ######'
    })

    // ModuleRow bar widths — normalise so live install-count changes
    // don't shift bar geometry.
    document.querySelectorAll('.h-full.rounded-full.bg-primary').forEach(el => {
      el.setAttribute('style', 'width: 50%')
    })

    // ActivityRow timestamps ("3m", "2h", "5d", "1w").
    document.querySelectorAll('.w-7.shrink-0.text-xs.text-dimmed').forEach(el => {
      el.textContent = '##'
    })

    // ActivityRow two-line layout: repo link (row 1) + verb/rest div (row 2).
    document.querySelectorAll('.min-w-0.flex-1.truncate').forEach(el => {
      el.textContent = '######'
    })
    document.querySelectorAll('.pl-10.text-xs.text-muted').forEach(el => {
      el.textContent = '######'
    })

    // ContributionHeatmap cells — replace live levels with a fixed
    // repeating pattern so the grid never drifts with the calendar.
    const heatmap = document.querySelector('.grid.grid-flow-col.grid-rows-7')
    if (heatmap) {
      const tones = ['bg-elevated', 'bg-primary/30', 'bg-primary/60', 'bg-primary']
      const pattern = [0, 1, 0, 2, 1, 0, 3, 1, 0, 2, 0, 1, 0, 0]
      Array.from(heatmap.children).forEach((cell, i) => {
        tones.forEach(t => cell.classList.remove(t))
        cell.classList.add(tones[pattern[i % pattern.length]]!)
      })
    }
  })
}

/** Navigate to a page and stabilise it (freeze + font-normalise) for capture. */
async function gotoSnapshot(page: Page, url: string) {
  await blockDynamicContent(page)
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  // Inject AFTER hydration so unhead doesn't strip it.
  await page.addStyleTag({ content: FREEZE_CSS })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  // app.vue dismisses the boot splash once fonts + (on the homepage) the
  // activity feed are ready, capped at a 2.5s timeout, plus a 300ms floor;
  // wait for the splash copy to leave the DOM so it is never captured.
  await page.waitForFunction(() => !document.body?.textContent?.includes('booting'), { timeout: 4000 }).catch(() => {})
  // Mask build-time baked dynamic content before capture.
  await freezeDynamicContent(page)
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
  await gotoSnapshot(page, '/writing/hello-world-20211126')
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
