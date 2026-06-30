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
    await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute('content', 'summary')
  })

  test('referenced favicon asset resolves (200)', async ({ request, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const res = await request.get('/favicon.svg')
    expect(res.ok(), '/favicon.svg should return 200').toBe(true)
  })
})
