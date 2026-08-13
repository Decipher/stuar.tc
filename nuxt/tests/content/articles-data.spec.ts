import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { articleEntrySchema, deriveArticleSitemapMeta } from '../../content.schema'

// Real, enforced validation — @nuxt/content's `type: 'data'` collections do
// NOT actually reject non-conforming records at runtime (confirmed: a
// deliberately broken `path` was accepted straight into the content
// database with no error, even though content.schema.ts declares a regex
// constraint). This test parses every article file directly against that
// same schema, independent of whatever Nuxt Content itself does or doesn't
// enforce, so a bad path — or any other schema violation — actually fails
// CI instead of silently shipping.

const articlesDir = join(__dirname, '../../content/articles-data')
const files = readdirSync(articlesDir).filter((f) => f.endsWith('.json'))

describe('content/articles-data — schema validation', () => {
  it('found at least one article to validate', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s matches the articleEntries schema (including the path convention)', (file) => {
    const raw = JSON.parse(readFileSync(join(articlesDir, file), 'utf8'))
    const result = articleEntrySchema.safeParse(raw)
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues, null, 2)).toBe(true)
  })

  it.each(files)('%s\'s filename matches its own path', (file) => {
    const raw = JSON.parse(readFileSync(join(articlesDir, file), 'utf8'))
    const expectedFilename = `${raw.path.replace('/writing/', '')}.json`
    expect(file).toBe(expectedFilename)
  })

  it.each(files)('%s gets a non-null sitemap field so @nuxtjs/sitemap includes it', (file) => {
    const raw = JSON.parse(readFileSync(join(articlesDir, file), 'utf8'))
    const result = articleEntrySchema.safeParse(raw)
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data.sitemap, 'sitemap must default to a non-null value').not.toBeNull()
  })
})

describe('deriveArticleSitemapMeta — sitemap metadata derivation', () => {
  it('sets lastmod to the article publish date', () => {
    expect(deriveArticleSitemapMeta('2026-07-31T03:30:00Z').lastmod)
      .toEqual(new Date('2026-07-31T03:30:00Z'))
  })

  it('assigns priority 0.6 and changefreq monthly to recent articles (2026)', () => {
    const meta = deriveArticleSitemapMeta('2026-08-12T10:00:00Z')
    expect(meta.priority).toBe(0.6)
    expect(meta.changefreq).toBe('monthly')
  })

  it('assigns priority 0.6 and changefreq monthly to articles from the preceding year (2025)', () => {
    const meta = deriveArticleSitemapMeta('2025-06-15T12:00:00Z')
    expect(meta.priority).toBe(0.6)
    expect(meta.changefreq).toBe('monthly')
  })

  it('assigns priority 0.3 and changefreq yearly to old articles (2022)', () => {
    const meta = deriveArticleSitemapMeta('2022-03-01T01:29:30Z')
    expect(meta.priority).toBe(0.3)
    expect(meta.changefreq).toBe('yearly')
  })

  it.each(files)('%s: derived priority matches its publication year', (file) => {
    const raw = JSON.parse(readFileSync(join(articlesDir, file), 'utf8'))
    const meta = deriveArticleSitemapMeta(raw.date)
    const year = Number.parseInt(raw.date.slice(0, 4), 10)
    const isRecent = year >= new Date().getFullYear() - 1
    expect(meta.priority, `${file} (${year}) should be ${isRecent ? '0.6' : '0.3'}`)
      .toBe(isRecent ? 0.6 : 0.3)
  })

  it.each(files)('%s: derived lastmod matches its date field', (file) => {
    const raw = JSON.parse(readFileSync(join(articlesDir, file), 'utf8'))
    const meta = deriveArticleSitemapMeta(raw.date)
    expect(meta.lastmod).toEqual(new Date(raw.date))
  })
})

describe('content/articles-data — style rules', () => {
  // Em dashes (U+2014) are an AI writing tell. Use a regular hyphen,
  // colon, parentheses, or restructure instead. See content-voice.md.
  it.each(files)('%s contains no em dashes (U+2014)', (file) => {
    const raw = readFileSync(join(articlesDir, file), 'utf8')
    expect(raw).not.toContain('\u2014')
  })

  // "properly" is filler - if something is done right, show how.
  // See content-voice.md.
  it.each(files)('%s avoids the filler word "properly"', (file) => {
    const raw = readFileSync(join(articlesDir, file), 'utf8')
    expect(raw).not.toMatch(/\bproperly\b/i)
  })
})
