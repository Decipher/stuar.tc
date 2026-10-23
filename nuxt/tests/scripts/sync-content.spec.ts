import { describe, it, expect, vi } from 'vitest'

import {
  EntityRepo,
  NON_TOPIC_CATEGORIES,
  RELATED_COUNT,
  RELATED_VIEW_PATH,
  attachRelated,
  buildArticle,
  fetchRelatedFromView,
  isPublicTerm,
  relatedViewUrl,
  resolveRelated,
  slugify,
} from '../../scripts/sync-content.mjs'

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

describe('category visibility (field_public)', () => {
  function repoWithTerms() {
    const repo = new EntityRepo()
    repo.add({ uuid: 't-drupal', entityType: 'taxonomy_term', bundle: 'article_category', fields: { name: 'Drupal', drupal_internal__tid: 4, field_public: true } })
    // Terms created before field_public existed carry null: still public.
    repo.add({ uuid: 't-druxt', entityType: 'taxonomy_term', bundle: 'article_category', fields: { name: 'Druxt', drupal_internal__tid: 1, field_public: null } })
    repo.add({ uuid: 't-planet', entityType: 'taxonomy_term', bundle: 'article_category', fields: { name: 'Planet Drupal', drupal_internal__tid: 2, field_public: false } })
    repo.add({ uuid: 't-caching', entityType: 'taxonomy_term', bundle: 'article_category', fields: { name: 'Caching', drupal_internal__tid: 7, field_public: false } })
    return repo
  }
  const categoryRefs = ['t-drupal', 't-druxt', 't-planet', 't-caching'].map((targetUuid) => ({ targetUuid }))

  it('keeps public terms in categories and moves the rest to hiddenCategories', () => {
    const article = buildArticle(repoWithTerms(), makeArticleNode({
      title: 'Tagged', field_published: '2026-01-01T00:00:00+00:00', field_article_category: categoryRefs,
    }))
    expect(article.categories).toEqual(['Drupal', 'Druxt'])
    expect(article.hiddenCategories).toEqual(['Planet Drupal', 'Caching'])
  })

  it('lists topics by name, in field order, and an empty list when there are none', () => {
    const repo = repoWithTerms()
    repo.add({ uuid: 'topic-json', entityType: 'taxonomy_term', bundle: 'article_topic', fields: { name: 'JSON:API' } })
    repo.add({ uuid: 'topic-caching', entityType: 'taxonomy_term', bundle: 'article_topic', fields: { name: 'caching' } })
    const tagged = buildArticle(repo, makeArticleNode({
      title: 'Topics', field_published: '2026-01-01T00:00:00+00:00',
      field_topics: [{ targetUuid: 'topic-json' }, { targetUuid: 'topic-caching' }, { targetUuid: 'missing' }],
    }))
    expect(tagged.topics).toEqual(['JSON:API', 'caching'])
    expect(buildArticle(repo, makeArticleNode({ title: 'None', field_published: '2026-01-01T00:00:00+00:00' })).topics).toEqual([])
  })

  it('omits hiddenCategories when every term is public', () => {
    const article = buildArticle(repoWithTerms(), makeArticleNode({
      title: 'Public only', field_published: '2026-01-01T00:00:00+00:00', field_article_category: [{ targetUuid: 't-drupal' }],
    }))
    expect(article).not.toHaveProperty('hiddenCategories')
  })

  it('isPublicTerm treats only an explicit false as non-public', () => {
    expect(isPublicTerm({ fields: { field_public: false } })).toBe(false)
    expect(isPublicTerm({ fields: { field_public: true } })).toBe(true)
    expect(isPublicTerm({ fields: { field_public: null } })).toBe(true)
    expect(isPublicTerm({ fields: {} })).toBe(true)
  })

  it('passes topics, then non-public categories, to the view but never Planet Drupal', () => {
    const repo = repoWithTerms()
    repo.add({ uuid: 'topic-caching', entityType: 'taxonomy_term', bundle: 'article_topic', fields: { name: 'caching', drupal_internal__tid: 20 } })
    const node = makeArticleNode({ drupal_internal__nid: 10, field_article_category: categoryRefs, field_topics: [{ targetUuid: 'topic-caching' }] })
    const url = relatedViewUrl(repo, node, [7, 5])
    expect(url).toBe(`${RELATED_VIEW_PATH}?views-argument[]=10+7+5&views-argument[]=20+4+1+7`)
    expect(NON_TOPIC_CATEGORIES).toContain('Planet Drupal')
  })

  it('skips the view when the only category is Planet Drupal', () => {
    const node = makeArticleNode({ drupal_internal__nid: 10, field_article_category: [{ targetUuid: 't-planet' }] })
    expect(relatedViewUrl(repoWithTerms(), node)).toBeNull()
  })
})

describe('resolveRelated() — order, exclusions and fallbacks', () => {
  const self = '/writing/self-20260101'
  const p = (slug: string) => `/writing/${slug}-20260101`

  it('takes picks first, then the view, then the latest posts', () => {
    expect(resolveRelated({ self, picked: [p('pick')], view: [p('view-a'), p('view-b')], latest: [p('new')] })).toEqual([
      { path: p('pick'), source: 'picked' },
      { path: p('view-a'), source: 'view' },
      { path: p('view-b'), source: 'view' },
    ])
  })

  it('fills from the latest posts when picks and the view give fewer than three', () => {
    expect(resolveRelated({ self, picked: [], view: [p('view-a')], latest: [self, p('view-a'), p('new'), p('older')] })).toEqual([
      { path: p('view-a'), source: 'view' },
      { path: p('new'), source: 'latest' },
      { path: p('older'), source: 'latest' },
    ])
  })

  it('never lists the article itself or the same post twice', () => {
    const related = resolveRelated({ self, picked: [self, p('pick'), p('pick')], view: [p('pick'), self], latest: [self, p('pick'), p('a'), p('b')] })
    expect(related.map((entry) => entry.path)).toEqual([p('pick'), p('a'), p('b')])
    expect(related[0].source).toBe('picked')
  })

  it('stops at the requested count, even with more picks', () => {
    const picked = [p('a'), p('b'), p('c'), p('d')]
    expect(resolveRelated({ self, picked, view: [], latest: [] })).toHaveLength(RELATED_COUNT)
    expect(resolveRelated({ self, picked, view: [], latest: [] }, 2).map((entry) => entry.path)).toEqual([p('a'), p('b')])
  })

  it('returns what it has when there are not enough posts', () => {
    expect(resolveRelated({ self, picked: [], view: [], latest: [self, p('only')] })).toEqual([{ path: p('only'), source: 'latest' }])
  })
})

describe('fetchRelatedFromView()', () => {
  it('returns the view result UUIDs in order', async () => {
    const get = vi.fn().mockResolvedValue({ data: { data: [{ id: 'b', type: 'node--article' }, { id: 'a', type: 'node--article' }] } })
    expect(await fetchRelatedFromView({ get }, '/jsonapi/views/related_articles/jsonapi?x')).toEqual(['b', 'a'])
    expect(get).toHaveBeenCalledWith('/jsonapi/views/related_articles/jsonapi?x')
  })

  it('does not call the view without a URL', async () => {
    const get = vi.fn()
    expect(await fetchRelatedFromView({ get }, null)).toEqual([])
    expect(get).not.toHaveBeenCalled()
  })

  it('treats a failed or empty view as no results', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await fetchRelatedFromView({ get: vi.fn().mockRejectedValue(new Error('403')) }, '/v')).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('403'))
    expect(await fetchRelatedFromView({ get: vi.fn().mockResolvedValue({ data: {} }) }, '/v')).toEqual([])
    warn.mockRestore()
  })
})

describe('attachRelated() — the sync step', () => {
  const now = Date.parse('2026-10-23T09:00:00Z')

  function setup() {
    const repo = new EntityRepo()
    repo.add({ uuid: 't-drupal', entityType: 'taxonomy_term', bundle: 'article_category', fields: { name: 'Drupal', drupal_internal__tid: 4 } })
    const node = (uuid: string, nid: number, date: string, extra: Record<string, unknown> = {}) => {
      const entity = { uuid, entityType: 'node', bundle: 'article', fields: {
        title: uuid, drupal_internal__nid: nid, field_published: date,
        path: { alias: `/writing/${uuid}-20260101` }, field_article_category: [{ targetUuid: 't-drupal' }], ...extra,
      } }
      repo.add(entity)
      return entity
    }
    const nodes = [
      node('self', 1, '2026-10-01T00:00:00Z', { field_related: [{ targetUuid: 'future' }, { targetUuid: 'pick' }, { targetUuid: 'missing' }] }),
      node('pick', 2, '2026-01-01T00:00:00Z'),
      node('viewed', 3, '2026-02-01T00:00:00Z'),
      node('newest', 4, '2026-10-20T00:00:00Z'),
      node('future', 5, '2026-12-01T00:00:00Z'),
    ]
    const built = nodes.map((n) => ({ node: n, article: buildArticle(repo, n) }))
    return { repo, built }
  }

  it('resolves picks, then the view, then the latest, skipping future and unknown picks', async () => {
    const { repo, built } = setup()
    const get = vi.fn(async (url: string) => ({
      // The view also returns a post that is not in the sync (unpublished
      // to anonymous) and a future one: both are dropped.
      data: { data: url.includes('argument[]=1+5+2&') ? [{ id: 'gone' }, { id: 'future' }, { id: 'viewed' }] : [] },
    }))
    await attachRelated({ get }, repo, built, now)

    const self = built[0].article
    expect(self.related).toEqual([
      { path: '/writing/pick-20260101', source: 'picked' },
      { path: '/writing/viewed-20260101', source: 'view' },
      { path: '/writing/newest-20260101', source: 'latest' },
    ])
    // The picks' node IDs are excluded in the view's first argument.
    expect(get).toHaveBeenCalledWith(`${RELATED_VIEW_PATH}?views-argument[]=1+5+2&views-argument[]=4`)
  })

  it('falls back to the latest posts for every article when the view is down', async () => {
    const { repo, built } = setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await attachRelated({ get: vi.fn().mockRejectedValue(new Error('500')) }, repo, built, now)
    warn.mockRestore()

    const viewed = built.find(({ node }) => node.uuid === 'viewed')!.article
    expect(viewed.related).toEqual([
      { path: '/writing/newest-20260101', source: 'latest' },
      { path: '/writing/self-20260101', source: 'latest' },
      { path: '/writing/pick-20260101', source: 'latest' },
    ])
  })
})
