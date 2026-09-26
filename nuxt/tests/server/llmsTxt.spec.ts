import { describe, it, expect, vi } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createQueryCollectionMock } from '../setup/mockQueryCollection'
import { buildLlmsTxt } from '../../server/utils/llmsTxt'
import type { ArticleSummary } from '../../server/utils/articleFeed'

const mockData: ArticleSummary[] = [
  {
    path: '/writing/newer-post',
    title: 'A newer post',
    description: 'Newer description.',
    date: '2024-02-01T00:00:00.000Z',
    articleType: 'Blog post',
    categories: ['Planet Drupal'],
    paragraphs: [],
  },
  {
    path: '/writing/older-post',
    title: 'An older post',
    description: 'Older description.',
    date: '2024-01-01T00:00:00.000Z',
    articleType: 'Blog post',
    categories: [],
    paragraphs: [],
  },
  {
    path: '/writing/not-a-blog-post',
    title: 'Not a blog post',
    description: 'Not indexed.',
    date: '2024-03-01T00:00:00.000Z',
    articleType: 'Page',
    categories: [],
    paragraphs: [],
  },
]

vi.mock('@nuxt/content/server', () => ({
  queryCollection: createQueryCollectionMock(mockData),
}))

function makeEvent() {
  const req = new IncomingMessage(null as never)
  req.url = '/llms.txt'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

const build = () => buildLlmsTxt(mockData.slice(0, 2), { baseUrl: 'https://example.test' })

describe('buildLlmsTxt', () => {
  it('opens with an H1 then a blockquote summary, as the format requires', () => {
    const lines = build().split('\n')
    expect(lines[0]).toBe('# stuar.tc')
    expect(lines[1]).toBe('')
    expect(lines[2]!.startsWith('> ')).toBe(true)
  })

  it('uses only H1 and H2 headings', () => {
    const headings = build().split('\n').filter(line => line.startsWith('#'))
    expect(headings).toEqual(['# stuar.tc', '## Writing', '## Pages', '## Optional'])
  })

  it('lists articles in the order given, one link item each', () => {
    const items = build().split('\n').filter(line => line.startsWith('- ['))
    expect(items[0]).toContain('[A newer post]')
    expect(items[1]).toContain('[An older post]')
    expect(items[0]).toContain(': Newer description.')
  })

  it('builds absolute URLs against the supplied origin', () => {
    expect(build()).toContain('https://example.test/writing/newer-post?')
    expect(build()).not.toContain('](/writing/')
  })

  it('tags article and page links so assistant referrals are attributable in GA4', () => {
    const tagged = build().split('\n')
      .filter(line => line.startsWith('- [') && !line.includes('.xml'))
    expect(tagged).toHaveLength(7)
    for (const item of tagged)
      expect(item).toContain('?utm_source=llms-txt&utm_medium=ai&utm_campaign=syndication')
  })

  it('leaves feed URLs untagged, since nobody arrives from a subscription', () => {
    const feeds = build().split('\n').filter(line => line.startsWith('- [') && line.includes('.xml'))
    expect(feeds).toHaveLength(2)
    for (const feed of feeds)
      expect(feed).not.toContain('utm_')
  })

  it('indexes the static pages and both feeds', () => {
    const txt = build()
    for (const path of ['/', '/writing', '/open-source', '/about', '/community'])
      expect(txt).toContain(`https://example.test${path}?`)
    expect(txt).toContain('(https://example.test/blog.xml)')
    expect(txt).toContain('(https://example.test/planet-drupal.xml)')
  })

  it('puts the feeds under Optional, after the primary sections', () => {
    const lines = build().split('\n')
    expect(lines.indexOf('## Optional')).toBeGreaterThan(lines.indexOf('## Pages'))
    expect(lines.findIndex(l => l.includes('blog.xml'))).toBeGreaterThan(lines.indexOf('## Optional'))
  })

  it('ends with a trailing newline', () => {
    expect(build().endsWith('\n')).toBe(true)
  })
})

describe('llms.txt route', () => {
  it('indexes blog posts and excludes anything else', async () => {
    const { default: handler } = await import('../../server/routes/llms.txt.get')
    const txt = await handler(makeEvent())
    expect(txt).toContain('A newer post')
    expect(txt).toContain('An older post')
    expect(txt).not.toContain('Not a blog post')
  })

  it('serves a fixed, request-independent base URL', async () => {
    const { default: handler } = await import('../../server/routes/llms.txt.get')
    const txt = await handler(makeEvent())
    expect(txt).toContain('https://stuar.tc/writing/newer-post?')
  })

  it('sets a plain-text content type so browsers render it inline', async () => {
    const { default: handler } = await import('../../server/routes/llms.txt.get')
    const event = makeEvent()
    await handler(event)
    expect(event.node.res.getHeader('content-type')).toBe('text/plain; charset=utf-8')
  })
})
