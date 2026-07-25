import { describe, it, expect, vi } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createQueryCollectionMock } from '../setup/mockQueryCollection'

interface ArticleRow {
  path: string
  title: string
  description: string
  date: string
  articleType: string
  categories: string[]
  paragraphs: unknown[]
}

const mockData: ArticleRow[] = [
  {
    path: '/writing/blog-post',
    title: 'A blog post',
    description: 'Blog description.',
    date: '2024-01-01T00:00:00.000Z',
    articleType: 'Blog post',
    categories: ['Planet Drupal'],
    paragraphs: [],
  },
  {
    path: '/writing/planet-drupal-post',
    title: 'A Planet Drupal post',
    description: 'Planet Drupal description.',
    date: '2024-02-01T00:00:00.000Z',
    articleType: 'Blog post',
    categories: ['Planet Drupal'],
    paragraphs: [],
  },
  {
    path: '/writing/not-a-blog-post',
    title: 'Not a blog post',
    description: 'Not syndicated.',
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
  req.url = '/blog.xml'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('blog.xml route', () => {
  it('includes every "Blog post" article regardless of category', async () => {
    const { default: handler } = await import('../../server/routes/blog.xml.get')
    const xml = await handler(makeEvent())
    expect(xml).toContain('A blog post')
    expect(xml).toContain('A Planet Drupal post')
    expect(xml).not.toContain('Not a blog post')
  })

  it('serves a fixed, request-independent base URL', async () => {
    const { default: handler } = await import('../../server/routes/blog.xml.get')
    const xml = await handler(makeEvent())
    expect(xml).toContain('https://stuar.tc/writing/blog-post')
  })
})

describe('planet-drupal.xml route', () => {
  it('only includes blog posts tagged "Planet Drupal"', async () => {
    const { default: handler } = await import('../../server/routes/planet-drupal.xml.get')
    const xml = await handler(makeEvent())
    expect(xml).toContain('A blog post')
    expect(xml).toContain('A Planet Drupal post')
    expect(xml).not.toContain('Not a blog post')
  })

  it('uses the Planet Drupal feed title and description', async () => {
    const { default: handler } = await import('../../server/routes/planet-drupal.xml.get')
    const xml = await handler(makeEvent())
    expect(xml).toContain("Stuart Clark's Planet Drupal feed.")
  })
})
