import { describe, it, expect, vi } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createQueryCollectionMock } from '../setup/mockQueryCollection'
import { buildLlmsFullTxt } from '../../server/utils/llmsFullTxt'
import type { ArticleSummary } from '../../server/utils/articleFeed'

const article = (overrides: Partial<ArticleSummary>): ArticleSummary => ({
  path: '/writing/post',
  title: 'A post',
  description: 'Post description.',
  date: '2024-02-01T13:30:00+10:00',
  articleType: 'Blog post',
  categories: [],
  paragraphs: [],
  ...overrides,
})

const mockData: ArticleSummary[] = [
  article({ path: '/writing/newer-post', title: 'A newer post', paragraphs: [{ type: 'text_formatted', html: '<p>Newer body.</p>' }] }),
  article({ path: '/writing/older-post', title: 'An older post', date: '2024-01-01T00:00:00+10:00' }),
  article({ path: '/writing/not-a-blog-post', title: 'Not a blog post', articleType: 'Page' }),
]

vi.mock('@nuxt/content/server', () => ({
  queryCollection: createQueryCollectionMock(mockData),
}))

function makeEvent() {
  const req = new IncomingMessage(null as never)
  req.url = '/llms-full.txt'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

const build = (articles: ArticleSummary[]) => buildLlmsFullTxt(articles, { baseUrl: 'https://example.test' })

/** The rendered body of a single article built from the given paragraphs. */
const body = (paragraphs: unknown[]) => build([article({ paragraphs })]).split('> Post description.\n\n')[1]!.trimEnd()

describe('buildLlmsFullTxt', () => {
  it('opens with an H1, the shared site summary, and a pointer to the index', () => {
    const txt = build([])
    expect(txt.startsWith('# stuar.tc: full text\n\n> Stuart Clark:')).toBe(true)
    expect(txt).toContain('https://example.test/llms.txt')
    expect(txt.endsWith('\n')).toBe(true)
  })

  it('puts the site\'s pages first, then the articles in the order given, each after a rule', () => {
    const txt = build(mockData.slice(0, 2))
    expect(txt.split('\n').filter(line => line === '---')).toHaveLength(5)
    const order = ['## About Stuart Clark', '## Open source', '## Speaking and community', '## A newer post', '## An older post']
      .map(heading => txt.indexOf(heading))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order[0]).toBeGreaterThan(0)
  })

  it('gives pages a tagged source URL but no publication date', () => {
    const page = build([]).split('---\n\n')[1]!
    expect(page).toContain('Source: https://example.test/about?utm_source=llms-full-txt&utm_medium=ai&utm_campaign=syndication\n\n>')
    expect(page).not.toContain('Published:')
  })

  it('gives each article a tagged source URL to cite and its local publication date', () => {
    const txt = build([article({})])
    expect(txt).toContain('Source: https://example.test/writing/post?utm_source=llms-full-txt&utm_medium=ai&utm_campaign=syndication\nPublished: 2024-02-01')
    expect(txt).toContain('> Post description.')
  })

  it('converts prose, demoting its headings below the article title', () => {
    expect(body([{ type: 'text_formatted', html: '<h2>Inside</h2><p>See <a href="/writing/x">this</a>.</p>' }]))
      .toBe('### Inside\n\nSee [this](https://example.test/writing/x).')
  })

  it('fences code with its language, and a title when there is one', () => {
    expect(body([{ type: 'code', title: 'Install', language: 'bash', code: 'composer require x\n' }]))
      .toBe('**Install**\n\n```bash\ncomposer require x\n```')
    expect(body([{ type: 'code', code: 'plain' }])).toBe('```\nplain\n```')
  })

  it('lengthens the fence when the code contains one', () => {
    expect(body([{ type: 'code', language: 'markdown', code: '```js\nx\n```' }]))
      .toBe('````markdown\n```js\nx\n```\n````')
  })

  it('renders media as an absolute image with its caption, or without one', () => {
    expect(body([{ type: 'media', alt: 'Alt text', src: '/images/a.png', caption: '<p>Cap.</p>' }]))
      .toBe('![Alt text](https://example.test/images/a.png)\n\nCap.')
    expect(body([{ type: 'media', alt: 'Alt text', src: '/images/a.png' }]))
      .toBe('![Alt text](https://example.test/images/a.png)')
  })

  it('lists a repository\'s links, with Drupal.org only when it has a project page', () => {
    expect(body([{ type: 'repository', description: 'Repo.', url: 'https://github.com/x/y', gitpod: false, drupalUrl: 'https://www.drupal.org/project/y' }]))
      .toBe('Repo.\n\n- Source: https://github.com/x/y\n- Drupal.org: https://www.drupal.org/project/y')
    expect(body([{ type: 'repository', description: '<p>Repo.</p>', url: 'https://github.com/x/y', gitpod: true }]))
      .toBe('Repo.\n\n- Source: https://github.com/x/y')
  })

  it('renders a section\'s title as an H3 and walks every region in order', () => {
    expect(body([{ type: 'section', title: 'Part', layout: 'layout_twocol', regions: {
      first: [{ type: 'text_formatted', html: '<p>Left.</p>' }],
      second: [{ type: 'text_formatted', html: '<p>Right.</p>' }],
    } }])).toBe('### Part\n\nLeft.\n\nRight.')
    expect(body([{ type: 'section', layout: 'layout_onecol', regions: { content: [{ type: 'text_formatted', html: '<p>Untitled.</p>' }] } }]))
      .toBe('Untitled.')
  })

  it('renders cards, alone or grouped, with and without a title or link', () => {
    expect(body([{ type: 'card', title: 'Card', description: 'About it.', link: { href: '/writing/z', label: 'Read it' } }]))
      .toBe('#### Card\n\nAbout it.\n\n[Read it](https://example.test/writing/z)')
    expect(body([{ type: 'card_group', cards: [{ type: 'card', description: 'Bare card.' }] }]))
      .toBe('Bare card.')
  })

  it('renders a jumbotron\'s title and content, and a link', () => {
    expect(body([{ type: 'jumbotron', title: 'Callout', content: [{ type: 'link', link: { href: 'https://github.com/sponsors/x', label: 'Sponsor' } }] }]))
      .toBe('#### Callout\n\n[Sponsor](https://github.com/sponsors/x)')
    expect(body([{ type: 'jumbotron', content: [{ type: 'text_formatted', html: '<p>Untitled.</p>' }] }]))
      .toBe('Untitled.')
  })

  it('skips paragraph types it does not know, and empty prose', () => {
    expect(body([{ type: 'unknown' }, { type: 'text_formatted', html: '' }, { type: 'text_formatted', html: '<p>Kept.</p>' }]))
      .toBe('Kept.')
  })
})

describe('llms-full.txt route', () => {
  it('includes blog posts in full and excludes anything else', async () => {
    const { default: handler } = await import('../../server/routes/llms-full.txt.get')
    const txt = await handler(makeEvent())
    expect(txt).toContain('## A newer post')
    expect(txt).toContain('Newer body.')
    expect(txt).toContain('## An older post')
    expect(txt).not.toContain('Not a blog post')
  })

  it('serves a fixed, request-independent base URL', async () => {
    const { default: handler } = await import('../../server/routes/llms-full.txt.get')
    expect(await handler(makeEvent())).toContain('Source: https://stuar.tc/writing/newer-post?')
  })

  it('sets a plain-text content type so browsers render it inline', async () => {
    const { default: handler } = await import('../../server/routes/llms-full.txt.get')
    const event = makeEvent()
    await handler(event)
    expect(event.node.res.getHeader('content-type')).toBe('text/plain; charset=utf-8')
  })
})
