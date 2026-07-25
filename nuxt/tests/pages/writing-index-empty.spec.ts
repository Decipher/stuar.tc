import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import WritingIndex from '~/pages/writing/index.vue'

// Isolated from writing.spec.ts's populated-article mock: this exercises the
// `articles?.length ?? 0` fallback in the "// writing · N posts" eyebrow,
// which only fires when useAsyncData's `data` itself is still null/undefined
// (an empty array's `.length` is already 0, not nullish, so that case can't
// reach this branch).
mockNuxtImport('useAsyncData', () => {
  return () => ({ data: ref(null), refresh: () => Promise.resolve() })
})

describe('Writing index page with no article data', () => {
  it('shows 0 posts in the eyebrow when article data has not loaded', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    expect(wrapper.text()).toContain('0 posts')
  })
})
