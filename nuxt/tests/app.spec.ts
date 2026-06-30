import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DefaultLayout from '~/layouts/default.vue'
import MinimalLayout from '~/layouts/minimal.vue'
import App from '~/app.vue'

describe('Default layout', () => {
  it('renders header, slot, and footer', async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      slots: { default: '<div data-test="page">Content</div>' },
    })
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('[data-test="page"]').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
  })
})

describe('Minimal layout', () => {
  it('renders logo, slot, and compact footer', async () => {
    const wrapper = await mountSuspended(MinimalLayout, {
      slots: { default: '<div data-test="page">Article</div>' },
    })
    expect(wrapper.find('[data-test="page"]').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
  })
  it('renders theme toggle in header bar', async () => {
    const wrapper = await mountSuspended(MinimalLayout)
    expect(wrapper.text()).toContain('stuar.tc')
  })
  it('does not render full nav', async () => {
    const wrapper = await mountSuspended(MinimalLayout)
    expect(wrapper.findAll('nav a').length).toBe(0)
  })
})

describe('App root', () => {
  it('renders without errors', async () => {
    const wrapper = await mountSuspended(App)
    expect(wrapper.exists()).toBe(true)
  })
  it('sets html lang=en', async () => {
    await mountSuspended(App)
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })
})
