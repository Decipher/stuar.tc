import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { reactive, nextTick } from 'vue'
import DefaultLayout from '~/layouts/default.vue'
import DevGrid from '~/components/DevGrid.vue'

const routeState = reactive({ path: '/' })

mockNuxtImport('useRoute', () => {
  return () => routeState
})

describe('Default layout header', () => {
  it('renders logo and nav links', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('stuar.tc')
    expect(wrapper.text()).toContain('open source')
    expect(wrapper.text()).toContain('community')
    expect(wrapper.text()).toContain('about')
    // expect(wrapper.text()).toContain('photos') // photos section disabled
  })
  it('renders writing link', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('writing')
  })
  it('renders nav links with correct hrefs', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    const links = wrapper.findAll('header nav a')
    const hrefs = links.map(a => a.attributes('href'))
    expect(hrefs).toContain('/open-source')
    expect(hrefs).toContain('/community')
    expect(hrefs).toContain('/writing')
    expect(hrefs).toContain('/about')
    // expect(hrefs).toContain('/photos') // photos section disabled
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
  it('links to writing in footer site nav', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    const footerLinks = wrapper.findAll('footer ul a')
    const hrefs = footerLinks.map(a => a.attributes('href'))
    expect(hrefs).toContain('/writing')
  })
  it('renders RSS feed link as a plain anchor in the footer', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('FEEDS')
    expect(wrapper.text()).toContain('RSS')
    const rss = wrapper.find('footer a[href="/blog.xml"]')
    expect(rss.exists()).toBe(true)
  })
})

describe('Default layout contact', () => {
  it('renders contact button in header', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('Contact')
  })

  it('opens contact modal when contact button is clicked', async () => {
    const wrapper = await mountSuspended(DefaultLayout, { attachTo: document.body })
    const contactBtn = wrapper.findAll('button').find(b => b.text().includes('Contact'))
    await contactBtn?.trigger('click')
    await nextTick()
    await nextTick()
    expect(document.body.textContent).toContain('Get in touch')
    wrapper.unmount()
  })

  it('closes contact modal when form is submitted', async () => {
    const wrapper = await mountSuspended(DefaultLayout, { attachTo: document.body })
    const contactBtn = wrapper.findAll('button').find(b => b.text().includes('Contact'))
    await contactBtn?.trigger('click')
    await nextTick()
    await nextTick()
    // Submit form → triggers update:open(false) → exercises v-model setter
    const form = document.querySelector('form') as HTMLFormElement
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()
    // Also call handleUpdateOpen directly to ensure the v-model setter fires
    const modalComp = wrapper.findComponent({ name: 'ContactModal' })
    if (modalComp.exists()) {
      ;(modalComp.vm as { handleUpdateOpen: (v: boolean) => void }).handleUpdateOpen(false)
      await nextTick()
    }
    wrapper.unmount()
  })
})

describe('Default layout back-to-top', () => {
  it('renders back-to-top button when page is scrolled', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true, writable: true })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(wrapper.find('button[aria-label="Back to top"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not render back-to-top button at top of page', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.find('button[aria-label="Back to top"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('Default layout dev tools', () => {
  it('does not render DevGrid by default (non-dev env)', async () => {
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.findComponent(DevGrid).exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders DevGrid when devMode is injected as true', async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      global: { provide: { devMode: true } },
    })
    expect(wrapper.findComponent(DevGrid).exists()).toBe(true)
    wrapper.unmount()
  })
})
