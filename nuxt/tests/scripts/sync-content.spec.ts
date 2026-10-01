import { describe, it, expect } from 'vitest'

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

  it('does not let nested tags reconstruct after stripping (CodeQL: incomplete multi-character sanitization)', () => {
    const repo = new EntityRepo()
    const node = makeArticleNode({
      title: 'Some post',
      // A single non-looping `replace(/<[^>]+>/g, '')` pass removes only the
      // inner `<script>`, leaving `<scr` + `ipt>` reformed into `<script>`.
      field_description: '<scr<script>ipt>alert(1)</scr</script>ipt>',
      field_published: '2026-01-01T00:00:00+00:00',
    })
    const article = buildArticle(repo, node)
    expect(article.description).not.toContain('<script')
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

describe('media paths and redirects', () => {
  it('mediaSrc mirrors the Drupal path under /images/', async () => {
    const { mediaSrc } = await import('../../scripts/sync-content.mjs')
    expect(mediaSrc('public://writing/2026/hero.png')).toBe('/images/writing/2026/hero.png')
    expect(mediaSrc('public://image/legacy.png')).toBe('/images/image/legacy.png')
  })

  it('frontendFileUrl maps legacy flat uploads and the mirrored layout', async () => {
    const { frontendFileUrl } = await import('../../scripts/sync-content.mjs')
    expect(frontendFileUrl('sites/default/files/image/x.png')).toBe('/images/writing/x.png')
    expect(frontendFileUrl('/sites/default/files/writing/2026/x.png')).toBe('/images/writing/2026/x.png')
    expect(frontendFileUrl('/node/1')).toBeNull()
  })

  it('buildRedirectLines emits forced 301s for file moves only, deduplicated and sorted', async () => {
    const { buildRedirectLines } = await import('../../scripts/sync-content.mjs')
    const r = (from, to, code = 301) => ({
      redirect_source: [{ path: from }],
      redirect_redirect: [{ resolvable_uri: to }],
      status_code: [{ value: code }],
    })
    expect(buildRedirectLines([
      r('sites/default/files/image/b.png', '/sites/default/files/writing/2026/b.png'),
      r('sites/default/files/image/a.png', '/sites/default/files/writing/2026/a.png'),
      r('sites/default/files/image/a.png', '/sites/default/files/writing/2026/a.png'),
      r('articles/old', '/writing/new'),
      r('sites/default/files/image/same.png', '/sites/default/files/image/same.png'),
    ])).toEqual([
      '/images/writing/a.png /images/writing/2026/a.png 301!',
      '/images/writing/b.png /images/writing/2026/b.png 301!',
    ])
  })

  it('mergeRedirectsFile replaces only its own block and preserves hand rules', async () => {
    const { mergeRedirectsFile } = await import('../../scripts/sync-content.mjs')
    const hand = '# hand\n/feed.xml /blog.xml 301!\n'
    const first = mergeRedirectsFile(hand, ['/a /b 301!'])
    expect(first.startsWith(hand)).toBe(true)
    expect(first).toContain('/a /b 301!')
    const second = mergeRedirectsFile(first, ['/c /d 301!'])
    expect(second).not.toContain('/a /b 301!')
    expect(second).toContain('/c /d 301!')
    expect(second.startsWith(hand)).toBe(true)
    expect(second.match(/# BEGIN drupal-redirects/g)).toHaveLength(1)
  })
})

describe('internal card links', () => {
  it('labels a card that targets another article the way push-story strips it', async () => {
    const { EntityRepo, buildArticle } = await import('../../scripts/sync-content.mjs')
    const repo = new EntityRepo()
    repo.add({ uuid: 'target', entityType: 'node', bundle: 'article', fields: {
      title: 'Field Tokens 2.0.0', path: { alias: '/writing/field-tokens-200-20260722' }, field_content: [],
    } })
    repo.add({ uuid: 'sec', entityType: 'paragraph', bundle: 'section', fields: {
      behavior_settings: { layout_paragraphs: { layout: 'layout_onecol' } },
    } })
    repo.add({ uuid: 'card', entityType: 'paragraph', bundle: 'card', fields: {
      field_title: 'Connected to Field Tokens',
      field_link: { targetUuid: 'target', targetType: 'node--article' },
      behavior_settings: { layout_paragraphs: { parent_uuid: 'sec', region: 'content' } },
    } })
    const article = buildArticle(repo, makeArticleNode({
      title: 'Custom Formatters 4.1.0', path: { alias: '/writing/custom-formatters-410-20260731' },
      field_published: '2026-07-31T09:00:00+10:00',
      field_content: [{ targetUuid: 'sec' }, { targetUuid: 'card' }],
    }))
    const section = article.paragraphs[0] as { regions: Record<string, Array<{ type: string, link?: { href: string, label: string } }>> }
    const card = section.regions.content.find((p) => p.type === 'card')
    expect(card?.link).toEqual({ href: '/writing/field-tokens-200-20260722', label: 'Read the Field Tokens 2.0.0 post' })
  })
})
