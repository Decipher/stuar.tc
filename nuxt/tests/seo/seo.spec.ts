import { test, expect } from '@playwright/test'

test.describe('SEO & favicon metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has a lang attribute and non-empty title', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
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
})
