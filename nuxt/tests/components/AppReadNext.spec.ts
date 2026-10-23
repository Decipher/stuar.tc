import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { axe } from 'vitest-axe'
import AppReadNext from '~/components/AppReadNext.vue'

const { createQueryCollectionMock, mockData, trackClick } = await vi.hoisted(async () => {
  const { createQueryCollectionMock } = await import('../setup/mockQueryCollection')
  const post = (slug: string, title: string, date: string, categories: string[], topics: string[]) => ({
    path: `/writing/${slug}`,
    title,
    date,
    description: `${title} excerpt.`,
    readingTime: '4 min',
    articleType: 'Blog post',
    categories,
    topics,
    paragraphs: [],
  })
  const mockData = [
    post('druxt-auth', 'Druxt Auth 0.5.0', '2026-09-26T21:30:00+10:00', ['Drupal', 'Druxt'], ['authentication', 'Nuxt']),
    post('druxt-13x', 'Druxt (for Drupal) 1.3.x', '2026-09-09T19:30:00+10:00', ['Drupal'], ['CORS', 'JSON:API', 'caching']),
    post('site-settings', 'Drupal site settings over JSON:API', '2026-08-26T19:20:00+10:00', ['Drupal'], ['decoupled config']),
    post('field-tokens', 'Field Tokens 2.0.0', '2026-07-23T09:00:00+10:00', ['Drupal'], []),
  ]
  return { createQueryCollectionMock, mockData, trackClick: vi.fn() }
})

mockNuxtImport('queryCollection', () => createQueryCollectionMock(mockData))
mockNuxtImport('useRelatedTracking', () => () => ({ trackClick }))

const related = [
  { path: '/writing/druxt-auth', source: 'picked' as const },
  { path: '/writing/druxt-13x', source: 'view' as const },
  { path: '/writing/site-settings', source: 'latest' as const },
]

/**
 * Mounts the section for an article at /writing/self.
 *
 * @param entries - The stored related entries.
 * @returns The mounted wrapper.
 */
function mount(entries = related) {
  return mountSuspended(AppReadNext, {
    props: { path: `/writing/self-${entries.map((e) => e.path).join()}`, related: entries, topics: ['caching', 'JSON:API', 'Nuxt'] },
  })
}

describe('AppReadNext', () => {
  beforeEach(() => trackClick.mockClear())

  it('renders the heading and an All posts link to /writing', async () => {
    const wrapper = await mount()
    expect(wrapper.find('h2').text()).toBe('Read next')
    const all = wrapper.find('a[href="/writing"]')
    expect(all.exists()).toBe(true)
    expect(all.text()).toBe('All posts')
  })

  it('leads with a full card, with its excerpt, then two compact cards in order', async () => {
    const wrapper = await mount()
    const links = wrapper.findAll('section a[href^="/writing/"]')
    expect(links.map((a) => a.attributes('href'))).toEqual(['/writing/druxt-auth', '/writing/druxt-13x', '/writing/site-settings'])
    expect(links[0].text()).toContain('Druxt Auth 0.5.0 excerpt.')
    expect(links[0].text()).toContain('2026.09.26')
    // Compact cards carry no excerpt.
    expect(links[1].text()).not.toContain('excerpt.')
    expect(links[2].text()).not.toContain('excerpt.')
  })

  it('lists every topic on the lead, and only one shared topic on a compact card', async () => {
    const wrapper = await mount()
    const [lead, shared, none] = wrapper.findAll('section a[href^="/writing/"]')
    expect(lead!.text()).toContain('#authentication')
    expect(lead!.text()).toContain('#Nuxt')
    // druxt-13x shares JSON:API and caching with this post; only its first shared topic shows.
    expect(shared!.text()).toContain('#JSON:API')
    expect(shared!.text()).not.toContain('#caching')
    expect(shared!.text()).not.toContain('#CORS')
    // site-settings shares no topic, so shows none.
    expect(none!.text()).not.toContain('#')
  })

  it('flags a picked lead "Picked"', async () => {
    const wrapper = await mount()
    const lead = wrapper.find('a[href="/writing/druxt-auth"]')
    expect(lead.text()).toContain('Picked')
    expect(wrapper.text()).not.toContain('Latest')
  })

  it('gives a filled lead no flag at all', async () => {
    const wrapper = await mount([
      { path: '/writing/druxt-13x', source: 'view' },
      { path: '/writing/site-settings', source: 'latest' },
      { path: '/writing/field-tokens', source: 'latest' },
    ])
    const lead = wrapper.find('a[href="/writing/druxt-13x"]')
    expect(lead.text()).not.toContain('Picked')
    expect(lead.text()).not.toContain('Latest')
    expect(lead.text()).toContain('Druxt (for Drupal) 1.3.x excerpt.')
  })

  it('drops a path that no longer resolves and keeps the rest in order', async () => {
    const wrapper = await mount([
      { path: '/writing/gone', source: 'picked' },
      { path: '/writing/druxt-13x', source: 'view' },
      { path: '/writing/field-tokens', source: 'latest' },
    ])
    const links = wrapper.findAll('section a[href^="/writing/"]')
    expect(links.map((a) => a.attributes('href'))).toEqual(['/writing/druxt-13x', '/writing/field-tokens'])
  })

  it('renders a lone lead without the compact column', async () => {
    const wrapper = await mount([{ path: '/writing/field-tokens', source: 'latest' }])
    expect(wrapper.findAll('section article')).toHaveLength(1)
  })

  it('renders nothing when no entry resolves', async () => {
    const wrapper = await mount([{ path: '/writing/gone', source: 'view' }])
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('sends related_click with the position, source and target of the clicked card', async () => {
    const wrapper = await mount()
    await wrapper.find('a[href="/writing/druxt-auth"]').trigger('click')
    expect(trackClick).toHaveBeenLastCalledWith(1, 'picked', '/writing/druxt-auth')
    await wrapper.find('a[href="/writing/site-settings"]').trigger('click')
    expect(trackClick).toHaveBeenLastCalledWith(3, 'latest', '/writing/site-settings')
    expect(trackClick).toHaveBeenCalledTimes(2)
  })

  it('has no axe violations', async () => {
    const wrapper = await mount()
    const results = await axe(wrapper.element as HTMLElement)
    expect(results).toHaveNoViolations()
  })
})
