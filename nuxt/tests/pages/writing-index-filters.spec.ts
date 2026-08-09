import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import WritingIndex from '~/pages/writing/index.vue'

// Isolated from writing.spec.ts's ordering-focused mock: this dataset needs
// distinct/overlapping tags across posts to exercise the search box and the
// tag-toggle OR logic, neither of which the ordering-focused mock is shaped
// for.
const { createQueryCollectionMock, mockData } = await vi.hoisted(async () => {
  const { createQueryCollectionMock } = await import('../setup/mockQueryCollection')
  const mockData = [
    {
      path: '/writing/hello-world-20211126',
      date: '2021-11-26T04:58:31+00:00',
      title: 'Hello world',
      description: 'First post.',
      readingTime: '2 min',
      articleType: 'Blog post',
      categories: ['Druxt'],
      paragraphs: [],
    },
    {
      path: '/writing/config-pages-20220412',
      date: '2022-04-12T08:00:00+11:00',
      title: 'Decoupling configuration with Config Pages',
      description: 'Config pages.',
      readingTime: '3 min',
      articleType: 'Blog post',
      categories: ['Druxt', 'Planet Drupal'],
      paragraphs: [],
    },
    {
      path: '/writing/field-tokens-200-20260722',
      date: '2026-07-23T08:00:00+10:00',
      title: 'Field Tokens 2.0.0',
      description: 'Release notes.',
      readingTime: '2 min',
      articleType: 'Blog post',
      categories: ['Drupal', 'Planet Drupal'],
      paragraphs: [],
    },
  ]
  return { createQueryCollectionMock, mockData }
})

mockNuxtImport('queryCollection', () => createQueryCollectionMock(mockData))

describe('Writing index page — search and tag filtering', () => {
  it('renders a tag chip for every tag present in the data', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    for (const tag of ['Druxt', 'Planet Drupal', 'Drupal']) {
      expect(wrapper.text()).toContain(tag)
    }
  })

  it('filters posts by title via the search box', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    await wrapper.find('input[placeholder="Search posts…"]').setValue('field tokens')

    expect(wrapper.text()).toContain('Field Tokens 2.0.0')
    expect(wrapper.text()).not.toContain('Hello world')
    expect(wrapper.text()).not.toContain('Decoupling configuration')
  })

  it('shows the empty state with the quoted search term when nothing matches', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    await wrapper.find('input[placeholder="Search posts…"]').setValue('nonexistent post title')

    expect(wrapper.text()).toContain('No posts match “nonexistent post title”.')
  })

  it('filters posts by a single tag, OR-combines a second tag, and clears on deselect', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    const findTagButton = (label: string) =>
      wrapper.findAll('button').find(btn => btn.text() === label)!

    await findTagButton('Drupal').trigger('click')
    expect(wrapper.text()).toContain('Field Tokens 2.0.0')
    expect(wrapper.text()).not.toContain('Hello world')
    expect(wrapper.text()).not.toContain('Decoupling configuration')

    // OR logic: adding a second tag brings its posts in too, doesn't narrow further.
    await findTagButton('Druxt').trigger('click')
    expect(wrapper.text()).toContain('Field Tokens 2.0.0')
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).toContain('Decoupling configuration')

    // Deselecting both clears the filter entirely.
    await findTagButton('Drupal').trigger('click')
    await findTagButton('Druxt').trigger('click')
    expect(wrapper.text()).toContain('Field Tokens 2.0.0')
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).toContain('Decoupling configuration')
  })

  it('sorts newest-first by default, reflecting the underlying query order', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    const text = wrapper.text()
    expect(text.indexOf('Field Tokens 2.0.0')).toBeLessThan(text.indexOf('Decoupling configuration'))
    expect(text.indexOf('Decoupling configuration')).toBeLessThan(text.indexOf('Hello world'))
  })

  it('flips to oldest-first when the Date column header is toggled', async () => {
    const wrapper = await mountSuspended(WritingIndex)
    const dateHeader = wrapper.findAll('button').find(btn => btn.text() === 'Date')!
    await dateHeader.trigger('click')

    // The mobile card list has no TanStack sorting of its own — it mirrors
    // `sorting` manually — so this exercises that ascending branch.
    const text = wrapper.text()
    expect(text.indexOf('Hello world')).toBeLessThan(text.indexOf('Decoupling configuration'))
    expect(text.indexOf('Decoupling configuration')).toBeLessThan(text.indexOf('Field Tokens 2.0.0'))
  })
})
