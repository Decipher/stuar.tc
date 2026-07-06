import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { reactive, nextTick } from 'vue'
import DefaultLayout from '~/layouts/default.vue'

const routeState = reactive({ path: '/' })

mockNuxtImport('useRoute', () => {
  return () => routeState
})

describe('Default layout header', () => {
  it('renders logo and nav links', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('stuar.tc')
    expect(wrapper.text()).toContain('open source')
    expect(wrapper.text()).toContain('about')
    expect(wrapper.text()).toContain('photos')
  })
  // writing section disabled — re-enable when /writing returns to nav
  // it('renders writing link', async () => {
  //   const wrapper = await mountSuspended(DefaultLayout)
  //   expect(wrapper.text()).toContain('writing')
  // })
  it('renders nav links with correct hrefs', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    const links = wrapper.findAll('header nav a')
    const hrefs = links.map(a => a.attributes('href'))
    expect(hrefs).toContain('/open-source')
    // expect(hrefs).toContain('/writing') // writing section disabled
    expect(hrefs).toContain('/about')
    expect(hrefs).toContain('/photos')
  })
  it('marks active link when route matches exactly', async () => {
    routeState.path = '/open-source'
    const wrapper = await mountSuspended(DefaultLayout)
    const activeLink = wrapper.findAll('header nav a').find(a => a.attributes('href') === '/open-source')
    expect(activeLink?.classes()).toContain('text-primary')
  })
  it('marks active link when route starts with path', async () => {
    routeState.path = '/open-source/something'
    const wrapper = await mountSuspended(DefaultLayout)
    const activeLink = wrapper.findAll('header nav a').find(a => a.attributes('href') === '/open-source')
    expect(activeLink?.classes()).toContain('text-primary')
  })
})

describe('Default layout mobile menu', () => {
  it('renders elsewhere links in mobile menu footer when menu opens', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    const hamburger = wrapper.find('[aria-label="Open menu"]')
    await hamburger.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('drupal.org')
    expect(wrapper.text()).toContain('github')
    expect(wrapper.text()).toContain('linkedin')
  })
})

describe('Default layout footer', () => {
  it('renders full footer with site and elsewhere sections', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('stuar.tc')
    expect(wrapper.text()).toContain('SITE')
    expect(wrapper.text()).toContain('ELSEWHERE')
    expect(wrapper.text()).toContain('© 2026 Stuart Clark')
  })
  it('renders social links', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('drupal.org')
    expect(wrapper.text()).toContain('github')
  })
  // writing section disabled — re-enable when /writing returns to nav
  // it('links to writing in footer site nav', async () => {
  //   const wrapper = await mountSuspended(DefaultLayout)
  //   const footerLinks = wrapper.findAll('footer ul a')
  //   const hrefs = footerLinks.map(a => a.attributes('href'))
  //   expect(hrefs).toContain('/writing')
  // })
})
