import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import WritingIndex from '~/pages/writing/index.vue'
import ArticlePage from '~/pages/writing/[...slug].vue'

// mockNuxtImport's factory is hoisted above regular imports/consts, so both
// the shared mock builder and its data need to live inside vi.hoisted() —
// Vitest's documented workaround for referencing anything module-scoped
// from a hoisted mock factory.
//
// "Hello world" and "Later post" share the same calendar day but different
// times (mirrors the real hello-world/layout-paragraphs-module case, which
// looked tied until `date` stopped being truncated to just YYYY-MM-DD) —
// "Later post" published hours later that day should rank first in a
// newest-first listing.
const { createQueryCollectionMock, mockData } = await vi.hoisted(async () => {
  const { createQueryCollectionMock } = await import('../setup/mockQueryCollection')
  const mockData = [
    {
      path: '/writing/hello-world',
      date: '2021-11-26T04:58:31+00:00',
      title: 'Hello world',
      description: 'First post.',
      readingTime: '3 min',
      articleType: 'Blog post',
      categories: ['Druxt'],
      paragraphs: [{ type: 'text_formatted', html: '<p>Welcome.</p>' }],
    },
    {
      path: '/writing/test',
      date: '2021-11-26T12:29:30+00:00',
      title: 'Later post',
      description: 'A test.',
      readingTime: '5 min',
      articleType: 'Blog post',
      categories: ['Druxt'],
      paragraphs: [{ type: 'text_formatted', html: '<p>Testing.</p>' }],
    },
  ]
  return { createQueryCollectionMock, mockData }
})

mockNuxtImport('queryCollection', () => createQueryCollectionMock(mockData))

describe('Writing index page', () => {
  it('renders heading and articles', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    expect(wrapper.find('h1').text()).toBe('Writing')
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).toContain('Later post')
  })
  it('renders reading time and tags', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    expect(wrapper.text()).toContain('3 min')
    expect(wrapper.text()).toContain('Druxt')
  })
  it('renders an RSS link to /blog.xml', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    const rss = wrapper.find('a[href="/blog.xml"]')
    expect(rss.exists()).toBe(true)
    expect(rss.text()).toContain('RSS')
  })
  it('orders same-day articles by full timestamp, not just date', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    const text = wrapper.text()
    // "Later post" (12:29 that day) must render before "Hello world"
    // (04:58 that day) — both share the same YYYY-MM-DD, so this only
    // passes if ordering compares the full timestamp.
    expect(text.indexOf('Later post')).toBeLessThan(text.indexOf('Hello world'))
  })
})

describe('Article detail page', () => {
  it('renders article title and metadata', async () => {
    const wrapper = await mountSuspended(ArticlePage)
    expect(wrapper.find('h1').text()).toContain('Hello world')
    expect(wrapper.text()).toContain('2021.11.26')
    expect(wrapper.text()).toContain('3 min')
  })
  it('renders paragraphs via AppDruxtParagraph', async () => {
    const wrapper = await mountSuspended(ArticlePage)
    expect(wrapper.text()).toContain('Welcome.')
  })
  it('renders back link', async () => {
    const wrapper = await mountSuspended(ArticlePage)
    expect(wrapper.find('a[href="/writing"]').exists()).toBe(true)
  })
})
