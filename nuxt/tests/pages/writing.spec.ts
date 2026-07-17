import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import WritingIndex from '~/pages/writing/index.vue'
import ArticlePage from '~/pages/writing/[...slug].vue'

const mockData = [
  {
    path: '/writing/hello-world',
    date: '2021-11-26',
    title: 'Hello world',
    description: 'First post.',
    readingTime: '3 min',
    articleType: 'Blog post',
    categories: ['Druxt'],
    paragraphs: [{ type: 'text_formatted', html: '<p>Welcome.</p>' }],
  },
  {
    path: '/writing/test',
    date: '2022-04-12',
    title: 'Test post',
    description: 'A test.',
    readingTime: '5 min',
    articleType: 'Blog post',
    categories: ['Druxt'],
    paragraphs: [{ type: 'text_formatted', html: '<p>Testing.</p>' }],
  },
]

mockNuxtImport('queryCollection', () => {
  return () => ({
    order: () => ({
      all: async () => mockData,
    }),
    path: () => ({
      first: async () => mockData[0],
    }),
  })
})

describe('Writing index page', () => {
  it('renders heading and articles', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    expect(wrapper.find('h1').text()).toBe('Writing')
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).toContain('Test post')
  })
  it('renders article excerpts', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    expect(wrapper.text()).toContain('First post.')
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
