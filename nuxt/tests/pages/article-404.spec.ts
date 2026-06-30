import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useRoute', () => {
  return () => ({ path: '/writing/nonexistent' })
})

mockNuxtImport('queryCollection', () => {
  return () => ({
    path: () => ({
      first: async () => null,
    }),
  })
})

describe('Article detail page — 404', () => {
  it('renders nothing when article is not found', async () => {
    const ArticlePage = (await import('~/pages/writing/[...slug].vue')).default
    const wrapper = await mountSuspended(ArticlePage)
    expect(wrapper.find('article').exists()).toBe(false)
  })
})
