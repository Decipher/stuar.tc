import { describe, it, expect } from 'vitest'
import { buildArticleFeed, isBlogPost, isPlanetDrupal, type ArticleSummary } from '../../server/utils/articleFeed'

const BASE_URL = 'https://stuar.tc'

function article(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return {
    title: 'Hello world',
    path: '/writing/hello-world-20240101',
    description: 'A short summary.',
    date: '2024-01-01T00:00:00.000Z',
    articleType: 'Blog post',
    categories: [],
    paragraphs: [],
    ...overrides,
  }
}

describe('isBlogPost', () => {
  it('is true when articleType is "Blog post"', () => {
    expect(isBlogPost(article({ articleType: 'Blog post' }))).toBe(true)
  })

  it('is false for any other articleType', () => {
    expect(isBlogPost(article({ articleType: 'Page' }))).toBe(false)
  })
})

describe('isPlanetDrupal', () => {
  it('is true for a blog post tagged "Planet Drupal"', () => {
    expect(isPlanetDrupal(article({ articleType: 'Blog post', categories: ['Planet Drupal'] }))).toBe(true)
  })

  it('is false for a blog post without the "Planet Drupal" category', () => {
    expect(isPlanetDrupal(article({ articleType: 'Blog post', categories: ['Drupal'] }))).toBe(false)
  })

  it('is false for a non-blog-post even if tagged "Planet Drupal"', () => {
    expect(isPlanetDrupal(article({ articleType: 'Page', categories: ['Planet Drupal'] }))).toBe(false)
  })
})

describe('buildArticleFeed', () => {
  const options = {
    baseUrl: BASE_URL,
    path: '/blog.xml',
    title: 'Stuart Clark - Experimenting with Druxt',
    description: "Stuart Clark's Blog feed.",
  }

  it('builds a channel with no items for an empty article list', () => {
    const xml = buildArticleFeed([], options)
    expect(xml).toContain('<title>Stuart Clark - Experimenting with Druxt</title>')
    expect(xml).toContain(`<link>${BASE_URL}/open-source</link>`)
    expect(xml).toContain(`href="${BASE_URL}/blog.xml"`)
    expect(xml).not.toContain('<item>')
  })

  it('renders one <item> per article with title, link, and author', () => {
    const xml = buildArticleFeed([article()], options)
    expect(xml).toContain('<item>')
    expect(xml).toContain('<title><![CDATA[Hello world]]></title>')
    expect(xml).toContain(`${BASE_URL}/writing/hello-world-20240101`)
    expect(xml).toContain('stu@rtclark.net (Stuart Clark)')
  })

  it('embeds a teaser built from the paragraph tree in the item description', () => {
    const xml = buildArticleFeed(
      [article({ paragraphs: [{ type: 'text_formatted', html: '<p>Full body text.</p>' }] })],
      options,
    )
    expect(xml).toContain('Full body text.')
    expect(xml).toContain('Continue reading')
  })

  it('falls back to the article description when there is no prose to extract', () => {
    const xml = buildArticleFeed([article({ description: 'Fallback summary.', paragraphs: [] })], options)
    expect(xml).toContain('Fallback summary.')
  })

  it('generates a base64url-encoded OG image URL for the channel and each item', () => {
    const xml = buildArticleFeed([article({ title: 'A/B: Testing?' })], options)
    expect(xml).toContain('/_og/d/c_StuartcOgImage,')
    // The encoded title/value segments (between "_~" and the next comma) must
    // be base64url, not plain base64 — a raw "+", "/", or "=" in there would
    // break the OG renderer's comma-delimited param splitter.
    const segments = [...xml.matchAll(/_~([^,]+)/g)].map(m => m[1])
    expect(segments.length).toBeGreaterThanOrEqual(2)
    for (const segment of segments) {
      expect(segment).not.toMatch(/[+/=]/)
    }
  })

  it('encodes /q/-prefixed tracking URLs in the OG image value params', () => {
    const xml = buildArticleFeed([article({ title: 'Hello world' })], options)
    // Decode every value_~ segment and verify it encodes a /q/-prefixed URL.
    const valueSegments = [...xml.matchAll(/value_~([^,]+)/g)].map(m => m[1])
    expect(valueSegments.length).toBeGreaterThanOrEqual(2) // channel + item
    for (const segment of valueSegments) {
      const decoded = Buffer.from(segment, 'base64url').toString('utf-8')
      expect(decoded).toContain('/q/')
    }
    // The channel image encodes /q/open-source specifically.
    const channelValue = Buffer.from(valueSegments[0], 'base64url').toString('utf-8')
    expect(channelValue).toBe(`${BASE_URL}/q/open-source`)
    // The article image encodes /q/writing/...
    const itemValue = Buffer.from(valueSegments[1], 'base64url').toString('utf-8')
    expect(itemValue).toBe(`${BASE_URL}/q/writing/hello-world-20240101`)
  })

  it('orders items in the same order they were provided', () => {
    const xml = buildArticleFeed(
      [
        article({ title: 'First', path: '/writing/first' }),
        article({ title: 'Second', path: '/writing/second' }),
      ],
      options,
    )
    expect(xml.indexOf('First')).toBeLessThan(xml.indexOf('Second'))
  })
})
