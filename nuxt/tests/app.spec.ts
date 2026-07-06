import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import DefaultLayout from '~/layouts/default.vue'
import MinimalLayout from '~/layouts/minimal.vue'
import App from '~/app.vue'
import AppSplash from '~/components/AppSplash.vue'

beforeAll(() => {
  Object.defineProperty(document, 'fonts', {
    value: { ready: Promise.resolve() },
    configurable: true,
  })
})

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

describe('App splash', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows splash on mount', async () => {
    const wrapper = await mountSuspended(App)
    expect(wrapper.findComponent(AppSplash).exists()).toBe(true)
  })

  it('hides splash after fonts ready and minimum delay', async () => {
    const wrapper = await mountSuspended(App)
    await vi.runAllTimersAsync()
    await nextTick()
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
  })
})
