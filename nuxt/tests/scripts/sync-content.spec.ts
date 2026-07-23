import { describe, it, expect, vi } from 'vitest'

// sync-content.mjs imports the `druxt` and `druxt-schema` git dependencies at
// the top level. These packages lack valid ESM entry points for Vite's import
// analysis, so mock them to allow the pure helpers (EntityRepo, buildArticle,
// slugify) to be tested without the Drupal client stack.
vi.mock('druxt', () => ({ DruxtClient: vi.fn() }))
vi.mock('druxt-schema', () => ({ DruxtSchema: vi.fn() }))

// eslint-disable-next-line import/first -- vi.mock is hoisted above by Vitest
import { EntityRepo, buildArticle, slugify } from '../../scripts/sync-content.mjs'

function makeArticleNode(fields: Record<string, unknown>) {
  return { uuid: 'article-1', entityType: 'node', bundle: 'article', fields }
}

describe('sync-content.mjs — path resolution', () => {
  it('uses Drupal\'s real pathauto-computed alias when present', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'Field Tokens 2.0.0',
      path: { alias: '/writing/field-tokens-200', pid: 1, langcode: 'en' },
      field_published: '2026-07-22T09:00:00+10:00',
    })
    const article = buildArticle(repo, node)
    expect(article.path).toBe('/writing/field-tokens-200')
  })

  it('falls back to the hand-rolled slug only when no alias exists', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'A Draft With No Alias Yet',
      field_published: '2026-01-01T00:00:00+00:00',
    })
    const article = buildArticle(repo, node)
    expect(article.path).toBe('/writing/a-draft-with-no-alias-yet')
  })
})

describe('sync-content.mjs — date precision', () => {
  it('preserves the full field_published timestamp, not just the date', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'Hello world',
      path: { alias: '/writing/hello-world-20211126' },
      field_published: '2022-03-01T08:12:55+11:00',
    })
    const article = buildArticle(repo, node)
    // The real bug: two articles sharing a calendar day but published hours
    // apart used to look identical once `date` was truncated to 10 chars.
    expect(article.date).toBe('2022-03-01T08:12:55+11:00')
    expect(article.date).not.toBe('2022-03-01')
  })

  it('falls back to the node\'s created timestamp when field_published is absent', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'No override',
      created: '2021-11-26T04:58:31+00:00',
    })
    const article = buildArticle(repo, node)
    expect(article.date).toBe('2021-11-26T04:58:31+00:00')
  })

  it('sorts two same-day articles correctly once full precision is kept', () => {
    const repo = new EntityRepo()
    const earlier = buildArticle(repo, makeArticleNode({
      title: 'Hello world',
      field_published: '2022-03-01T08:12:55+11:00',
    }))
    const later = buildArticle(repo, makeArticleNode({
      title: 'Layout Paragraphs module',
      field_published: '2022-03-01T12:29:30+11:00',
    }))
    const sorted = [earlier, later].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    expect(sorted[0].title).toBe('Layout Paragraphs module')
    expect(sorted[1].title).toBe('Hello world')
  })
})

describe('sync-content.mjs — description normalization', () => {
  it('collapses literal CRLF paragraph breaks into single spaces', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'Hello world',
      field_description: 'First line.\r\n\r\nSecond line.\r\n\r\nThird line.',
      field_published: '2021-11-26T04:58:31+00:00',
    })
    const article = buildArticle(repo, node)
    expect(article.description).toBe('First line. Second line. Third line.')
  })

  it('strips HTML tags and normalizes surrounding whitespace together', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'Some post',
      field_description: '  <p>Hello</p>\n<p>world</p>  ',
      field_published: '2026-01-01T00:00:00+00:00',
    })
    const article = buildArticle(repo, node)
    expect(article.description).toBe('Hello world')
  })
})

describe('slugify()', () => {
  it('lowercases and hyphenates a title', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips punctuation outside [a-z0-9\\s-]', () => {
    expect(slugify('What, no images?')).toBe('what-no-images')
  })

  it('removes periods rather than converting them to hyphens (known limitation, why buildArticle prefers the real alias)', () => {
    expect(slugify('Field Tokens 2.0.0')).toBe('field-tokens-200')
  })
})
