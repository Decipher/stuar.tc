import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { articleEntrySchema } from '../../content.schema'

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
