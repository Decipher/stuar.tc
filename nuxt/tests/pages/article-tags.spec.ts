import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ArticlePage from '~/pages/writing/[...slug].vue'

// The article header's tag row: category pills, then (after a divider only
// when both kinds are present) quieter topic links. Each case is its own
// route so the page's useAsyncData key, and so the matched row, differs.
const { createQueryCollectionMock, mockData } = await vi.hoisted(async () => {
  const { createQueryCollectionMock } = await import('../setup/mockQueryCollection')
  const row = (slug: string, categories: string[], topics: string[]) => ({
    path: `/writing/${slug}`,
    date: '2026-01-01T00:00:00+00:00',
    title: slug,
    description: 'A post.',
    readingTime: '1 min',
    articleType: 'Blog post',
    categories,
    topics,
    paragraphs: [],
    related: [],
  })
  const mockData = [
    row('categories-only', ['Drupal'], []),
    row('topics-only', [], ['caching']),
    row('neither', [], []),
  ]
  return { createQueryCollectionMock, mockData }
})

mockNuxtImport('queryCollection', () => createQueryCollectionMock(mockData))

describe('Article header tags', () => {
  it('shows categories without a divider when there are no topics', async () => {
    const wrapper = await mountSuspended(ArticlePage, { route: '/writing/categories-only' })
    expect(wrapper.find('h1').text()).toBe('categories-only')
    expect(wrapper.text()).toContain('Drupal')
    expect(wrapper.find('span[aria-hidden="true"].w-px').exists()).toBe(false)
    expect(wrapper.find('a[href^="/writing?topic="]').exists()).toBe(false)
  })

  it('shows topics without a divider when there are no categories', async () => {
    const wrapper = await mountSuspended(ArticlePage, { route: '/writing/topics-only' })
    expect(wrapper.find('h1').text()).toBe('topics-only')
    expect(wrapper.find('a[href="/writing?topic=caching"]').exists()).toBe(true)
    expect(wrapper.find('span[aria-hidden="true"].w-px').exists()).toBe(false)
  })

  it('renders no tag row at all when there are neither', async () => {
    const wrapper = await mountSuspended(ArticlePage, { route: '/writing/neither' })
    expect(wrapper.find('h1').text()).toBe('neither')
    expect(wrapper.find('.rounded-full.border').exists()).toBe(false)
    expect(wrapper.find('a[href^="/writing?topic="]').exists()).toBe(false)
  })
})
