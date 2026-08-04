import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const articlesDir = join(__dirname, '../../content/articles-data')
const articlePaths = readdirSync(articlesDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(articlesDir, f), 'utf8')).path as string)

test.describe('SEO & favicon metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has a lang attribute and non-empty title', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('title suffix "· stuar.tc" appears exactly once on every page, including articles', async ({ page }) => {
    for (const path of ['/', '/about', '/community', '/open-source', '/writing', ...articlePaths]) {
      await page.goto(path)
      const title = await page.title()
      const occurrences = title.split('· stuar.tc').length - 1
      expect(occurrences, `${path} title "${title}" should have exactly one "· stuar.tc" suffix`).toBe(1)
      expect(title, `${path} title "${title}" should end with the suffix`).toMatch(/· stuar\.tc$/)
    }
  })

  test('declares favicon in the head', async ({ page }) => {
    await expect(page.locator('head link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', /favicon\.svg$/)
  })

  test('has a meta description and theme-color', async ({ page }) => {
    const description = page.locator('head meta[name="description"]')
    await expect(description).toHaveAttribute('content', /.+/)
    await expect(page.locator('head meta[name="theme-color"]')).toHaveAttribute('content', '#C21A74')
  })

  test('has Open Graph and Twitter card metadata', async ({ page }) => {
    await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  })

  test('referenced favicon asset resolves (200)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/favicon.svg')
    expect(res.ok(), '/favicon.svg should return 200').toBe(true)
  })

  test('emits a non-empty og:image', async ({ page }) => {
    await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute('content', /.+/)
  })

  test('emits a non-empty twitter:image', async ({ page }) => {
    await expect(page.locator('head meta[name="twitter:image"]')).toHaveAttribute('content', /.+/)
  })

  test('og:image asset resolves (200, image/*)', async ({ page, request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const src = await page.locator('head meta[property="og:image"]').getAttribute('content')
    expect(src, 'og:image content must be present').toBeTruthy()
    // Strip origin if absolute — the path resolves against the local test server
    const path = src!.replace(/^https?:\/\/[^/]+/, '')
    const url = `${baseURL}${path}`
    const res = await request.get(url)
    expect(res.ok(), `og:image "${url}" should return 200`).toBe(true)
    const contentType = res.headers()['content-type'] || ''
    expect(contentType, `og:image content-type should be image/*, got "${contentType}"`).toMatch(/^image\//)
  })
})

test.describe('Meta fundamentals — JSON-LD, manifest, sitemap, robots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has WebSite and Person JSON-LD', async ({ page }) => {
    const scripts = page.locator('head script[type="application/ld+json"]')
    const count = await scripts.count()
    expect(count, 'at least one JSON-LD script block').toBeGreaterThan(0)
    const json = await scripts.first().textContent()
    expect(json, 'JSON-LD content must be present').toBeTruthy()
    const parsed = JSON.parse(json!)
    const graph = parsed['@graph'] || [parsed]
    const types = graph.map((n: { '@type': string }) => n['@type'])
    expect(types, 'JSON-LD must include WebSite type').toContain('WebSite')
    expect(types, 'JSON-LD must include Person type').toContain('Person')
  })

  test('declares web manifest link', async ({ page }) => {
    await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  })

  test('manifest asset resolves (200, application/manifest+json)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/manifest.webmanifest')
    expect(res.ok(), '/manifest.webmanifest should return 200').toBe(true)
    const contentType = res.headers()['content-type'] || ''
    expect(contentType, `manifest content-type should contain manifest or json, got "${contentType}"`).toMatch(/manifest|json/)
  })

  test('sitemap.xml resolves (200)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/sitemap.xml')
    expect(res.ok(), '/sitemap.xml should return 200').toBe(true)
    const body = await res.text()
    expect(body, 'sitemap should contain <urlset>').toContain('<urlset')
    expect(body, 'sitemap should list homepage').toContain('https://stuar.tc/')
  })

  test('sitemap.xml includes lastmod, priority, and changefreq on every url entry', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/sitemap.xml')
    const body = await res.text()
    // Extract every <url> block and assert each carries the three elements.
    const urlBlocks = body.match(/<url>([\s\S]*?)<\/url>/g) ?? []
    expect(urlBlocks.length, 'sitemap should have at least one <url> entry').toBeGreaterThan(0)
    for (const block of urlBlocks) {
      expect(block, 'every <url> must contain <lastmod>').toContain('<lastmod>')
      expect(block, 'every <url> must contain <priority>').toContain('<priority>')
      expect(block, 'every <url> must contain <changefreq>').toContain('<changefreq>')
    }
  })

  test('sitemap.xml static page priorities are correct', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/sitemap.xml')
    const body = await res.text()
    const homeBlock = body.match(/https:\/\/stuar\.tc\/<\/loc>[\s\S]*?<\/url>/)?.[0] ?? ''
    expect(homeBlock, 'homepage priority should be 1.0').toContain('<priority>1.0</priority>')
    expect(homeBlock, 'homepage changefreq should be weekly').toContain('<changefreq>weekly</changefreq>')

    const writingBlock = body.match(/https:\/\/stuar\.tc\/writing<\/loc>[\s\S]*?<\/url>/)?.[0] ?? ''
    expect(writingBlock, '/writing priority should be 0.9').toContain('<priority>0.9</priority>')

    const ossBlock = body.match(/https:\/\/stuar\.tc\/open-source<\/loc>[\s\S]*?<\/url>/)?.[0] ?? ''
    expect(ossBlock, '/open-source priority should be 0.8').toContain('<priority>0.8</priority>')
  })

  test('sitemap.xml differentiates recent and old article priorities', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/sitemap.xml')
    const body = await res.text()
    // Derive the expected priority from the same dynamic threshold the
    // production code uses (current year - 1), not a hardcoded year.
    const recentThreshold = new Date().getFullYear() - 1
    for (const path of articlePaths) {
      const block = body.match(new RegExp(`https://stuar\\.tc${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>`))?.[0] ?? ''
      expect(block, `sitemap should contain ${path}`).not.toBe('')
      const year = Number.parseInt(path.match(/(\d{8})$/)?.[1]?.slice(0, 4) ?? '0', 10)
      const expectedPriority = year >= recentThreshold ? '0.6' : '0.3'
      expect(block, `${path} (${year}) should have priority ${expectedPriority}`).toContain(`<priority>${expectedPriority}</priority>`)
    }
  })

  test('sitemap.xml never leaks a Netlify deploy URL', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/sitemap.xml')
    const body = await res.text()
    expect(body, 'sitemap should not contain a netlify.app URL').not.toContain('netlify.app')
  })

  test('sitemap.xml lists every writing article under the production domain', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    expect(articlePaths.length, 'expected at least one article to check').toBeGreaterThan(0)
    const res = await request.get('/sitemap.xml')
    const body = await res.text()
    for (const path of articlePaths)
      expect(body, `sitemap should list https://stuar.tc${path}`).toContain(`https://stuar.tc${path}`)
  })

  test('every writing article page in the sitemap actually resolves (200)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    for (const path of articlePaths) {
      const res = await request.get(path)
      expect(res.ok(), `${path} should return 200`).toBe(true)
      const body = await res.text()
      expect(body, `${path} should render as a real article page`).toContain('<article')
    }
  })

  test('every writing article page has BlogPosting JSON-LD referencing the site-wide Person entity', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    expect(articlePaths.length, 'expected at least one article to check').toBeGreaterThan(0)
    for (const path of articlePaths) {
      await page.goto(path)
      const scripts = page.locator('head script[type="application/ld+json"]')
      const count = await scripts.count()
      const bodies = await Promise.all(Array.from({ length: count }, (_, i) => scripts.nth(i).textContent()))
      const parsedNodes = bodies.map(b => JSON.parse(b!))
      const blogPosting = parsedNodes.find(n => n['@type'] === 'BlogPosting')
      const canonicalUrl = `https://stuar.tc${path}`
      expect(blogPosting, `${path} should emit a BlogPosting JSON-LD node`).toBeTruthy()
      expect(blogPosting['@id'], `${path} BlogPosting @id`).toBe(`${canonicalUrl}#article`)
      expect(blogPosting.mainEntityOfPage, `${path} BlogPosting mainEntityOfPage`).toBe(canonicalUrl)
      expect(blogPosting.url, `${path} BlogPosting url`).toBe(canonicalUrl)
      expect(blogPosting.headline, `${path} BlogPosting headline`).toBeTruthy()
      expect(blogPosting.description, `${path} BlogPosting description`).toBeTruthy()
      expect(blogPosting.datePublished, `${path} BlogPosting datePublished`).toBeTruthy()
      // Google's structured-data rules only accept Organization or Person
      // for `publisher` — both author and publisher reference the Person
      // node, not the WebSite node.
      expect(blogPosting.author).toEqual({ '@id': 'https://stuar.tc/#person' })
      expect(blogPosting.publisher).toEqual({ '@id': 'https://stuar.tc/#person' })
    }
  })

  test('robots.txt contains resolving Sitemap directive', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/robots.txt')
    expect(res.ok(), '/robots.txt should return 200').toBe(true)
    const body = await res.text()
    expect(body, 'robots.txt should contain Sitemap: directive').toContain('Sitemap: https://stuar.tc/sitemap.xml')
  })

  test('declares RSS feed alternate links', async ({ page }) => {
    await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"][href="/blog.xml"]')).toHaveCount(1)
    await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"][href="/planet-drupal.xml"]')).toHaveCount(1)
  })

  test('/blog.xml resolves (200, application/rss+xml)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/blog.xml')
    expect(res.ok(), '/blog.xml should return 200').toBe(true)
    expect(res.headers()['content-type']).toContain('application/rss+xml')
    expect(await res.text()).toContain('<rss version="2.0"')
  })

  test('/planet-drupal.xml resolves (200, application/rss+xml)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/planet-drupal.xml')
    expect(res.ok(), '/planet-drupal.xml should return 200').toBe(true)
    expect(res.headers()['content-type']).toContain('application/rss+xml')
    expect(await res.text()).toContain('<rss version="2.0"')
  })

  test('OG image PNG matches baseline snapshot', async ({ page, request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await page.goto('/')
    const ogSrc = await page.locator('head meta[property="og:image"]').getAttribute('content')
    expect(ogSrc, 'og:image must be present').toBeTruthy()
    // Strip origin so the path resolves against the local test server.
    const path = ogSrc!.replace(/^https?:\/\/[^/]+/, '')
    const res = await request.get(`${baseURL}${path}`)
    expect(res.ok(), `OG image "${path}" should return 200`).toBe(true)
    const png = await res.body()
    await expect(png).toMatchSnapshot('og-image-home.png', { maxDiffPixelRatio: 0.02 })
  })

  test('OG image URL encodes a /q/-prefixed URL for QR tracking', async ({ page }) => {
    await page.goto('/')
    const ogSrc = await page.locator('head meta[property="og:image"]').getAttribute('content')
    expect(ogSrc, 'og:image must be present').toBeTruthy()
    // Descriptive OG image URLs embed props as comma-separated key_value pairs.
    // The `value_~` param is base64url-encoded; decode and assert /q/ prefix.
    const valueMatch = ogSrc!.match(/value_~([A-Za-z0-9-~]+)/)
    expect(valueMatch, 'OG image URL must contain a value_ param (descriptive format)').toBeTruthy()
    const b64 = valueMatch![1].replace(/-/g, '+').replace(/~/g, '/')
    const decoded = Buffer.from(b64 + '='.repeat((4 - b64.length % 4) % 4), 'base64').toString('utf8')
    expect(decoded, 'QR value must use /q/ prefix for campaign tracking').toContain('/q/')
  })
})

test.describe('Version indicator and h4ck panel (production build)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('footer shows the version as plain text, not a link', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText(/v\d+\.\d+\.\d+/)
    const versionLink = footer.locator('a', { hasText: /^v\d+\.\d+\.\d+$/ })
    expect(await versionLink.count(), 'version text should not be a link').toBe(0)
  })

  test('/changelog has no routed page', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/changelog')
    expect(res.status(), '/changelog should 404 — the changelog only renders inside the panel').toBe(404)
  })

  test('Konami code + passphrase reveals the panel with real changelog content inline, no dev tools', async ({ page }) => {
    await page.locator('body').click()
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'a', 'b']
    for (const key of konami) {
      await page.keyboard.press(key)
      await page.waitForTimeout(50)
    }

    await page.locator('.sc-pi-badge').click()
    await page.locator('input[type="password"]').fill('hacktheplanet')
    await page.locator('input[type="password"]').press('Enter')

    await expect(page.getByText('H4CK TH3 PL4N3T')).toBeVisible()
    const body = page.locator('body')
    await expect(body).toContainText('// VERSION')
    await expect(body).toContainText(/stuar\.tc v\d+\.\d+\.\d+/)
    // Collapsed by default, so it doesn't push the rest of the console
    // (dev tools, in dev mode) below the fold.
    await expect(body).not.toContainText('Keep a Changelog')
    await page.getByRole('button', { name: 'Changelog' }).click()
    // Real changelog content, rendered inline — not a link to a page.
    await expect(body).toContainText('Keep a Changelog')
    await expect(page.locator('a[href="/changelog"]')).toHaveCount(0)
    // Production build: only the VERSION section, no dev-only tooling.
    await expect(body).not.toContainText('COLOR SCHEME')
    await expect(body).not.toContainText('MEASURE')
    await expect(body).not.toContainText('CLIENT DATA')
  })
})
