import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick, ref, reactive } from 'vue'
import DefaultLayout from '~/layouts/default.vue'
import MinimalLayout from '~/layouts/minimal.vue'
import App from '~/app.vue'
import AppSplash from '~/components/AppSplash.vue'

// Real homepage content (via useActivity) marks home-readiness true almost
// immediately in tests (useFetch settles synchronously), which would race
// out the app.vue timeout-fallback branch below. Stub it so tests can hold
// readiness false deterministically.
const homeReadyState = ref(false)
mockNuxtImport('useHomeReadiness', () => () => homeReadyState)

const routeState = reactive({ path: '/' })
mockNuxtImport('useRoute', () => () => routeState)

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
  it('does not render full site nav', async () => {
    const wrapper = await mountSuspended(MinimalLayout)
    expect(wrapper.find('header nav').exists()).toBe(false)
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
  beforeEach(() => {
    vi.useFakeTimers()
    homeReadyState.value = false
    routeState.path = '/'
  })
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

  it('hides splash once the home-readiness timeout elapses, even if data never settles', async () => {
    const wrapper = await mountSuspended(App)
    await vi.advanceTimersByTimeAsync(2500)
    await nextTick()
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
  })

  it('does not hide splash before the minimum delay, even once home-readiness resolves', async () => {
    const wrapper = await mountSuspended(App)
    homeReadyState.value = true
    await vi.advanceTimersByTimeAsync(100)
    await nextTick()
    expect(wrapper.findComponent(AppSplash).exists()).toBe(true)
  })

  it('hides splash after only the minimum delay when home-readiness is already true on mount', async () => {
    homeReadyState.value = true
    const wrapper = await mountSuspended(App)
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
  })

  it('skips the home-readiness wait on non-home routes, hiding splash after only the minimum delay', async () => {
    routeState.path = '/about'
    const wrapper = await mountSuspended(App)
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
  })
})
