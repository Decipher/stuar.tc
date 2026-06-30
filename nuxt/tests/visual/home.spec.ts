import { test, expect } from '@playwright/test'

test('home page visual regression', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('home.png', { fullPage: true })
})

test('about page visual regression', async ({ page }) => {
  await page.goto('/about')
  await expect(page).toHaveScreenshot('about.png', { fullPage: true })
})

test('open-source page visual regression', async ({ page }) => {
  await page.goto('/open-source')
  await expect(page).toHaveScreenshot('open-source.png', { fullPage: true })
})

test('writing index visual regression', async ({ page }) => {
  await page.goto('/writing')
  await expect(page).toHaveScreenshot('writing.png', { fullPage: true })
})

test('article detail visual regression', async ({ page }) => {
  await page.goto('/writing/hello-world')
  await expect(page).toHaveScreenshot('article.png', { fullPage: true })
})

test('styleguide visual regression', async ({ page }) => {
  await page.goto('/styleguide')
  await expect(page).toHaveScreenshot('styleguide.png', { fullPage: true })
})

test('uses page visual regression', async ({ page }) => {
  await page.goto('/uses')
  await expect(page).toHaveScreenshot('uses.png', { fullPage: true })
})

test('photos page visual regression', async ({ page }) => {
  await page.goto('/photos')
  await expect(page).toHaveScreenshot('photos.png', { fullPage: true })
})
