import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { reactive, nextTick } from 'vue'
import AppGiscusComments from '~/components/AppGiscusComments.vue'

const colorState = reactive({ mode: 'light' })

mockNuxtImport('useColorMode', () => {
  return () => ({
    get value() { return colorState.mode },
  })
})

describe('AppGiscusComments', () => {
  it('renders the discussion heading and a container scoped to the article path', async () => {
    colorState.mode = 'light'
    const wrapper = await mountSuspended(AppGiscusComments, { props: { path: '/writing/example' } })
    expect(wrapper.text()).toContain('Discussion')
    expect(wrapper.text()).toContain('GitHub Discussions')
  })

  it('injects the giscus client script with the current theme on mount', async () => {
    colorState.mode = 'dark'
    const wrapper = await mountSuspended(AppGiscusComments, { props: { path: '/writing/example' } })
    const script = wrapper.element.querySelector('script')
    expect(script).not.toBeNull()
    expect(script?.src).toBe('https://giscus.app/client.js')
    expect(script?.getAttribute('data-theme')).toContain('giscus-theme-dark.css')
    expect(script?.getAttribute('data-repo')).toBe('Decipher/stuar.tc')
  })

  // These four attributes are what bind the embed to a real GitHub Discussions
  // category. Every one of them fails silently if wrong — giscus renders an
  // empty state rather than an error — so nothing else in the suite would
  // notice a bad value. The IDs are opaque GitHub node IDs and cannot be
  // derived from the repo name, which is exactly why they are pinned here.
  it('pins the giscus repo, category and mapping that address the discussion', async () => {
    colorState.mode = 'light'
    const wrapper = await mountSuspended(AppGiscusComments, { props: { path: '/writing/example' } })
    const script = wrapper.element.querySelector('script')
    expect(script?.getAttribute('data-repo')).toBe('Decipher/stuar.tc')
    expect(script?.getAttribute('data-repo-id')).toBe('R_kgDOGZt96w')
    expect(script?.getAttribute('data-category')).toBe('General')
    expect(script?.getAttribute('data-category-id')).toBe('DIC_kwDOGZt9684CAB_7')
    // pathname mapping is what makes each article its own thread. Changing it
    // silently orphans every existing discussion.
    expect(script?.getAttribute('data-mapping')).toBe('pathname')
  })

  it('re-injects the client when navigating between articles', async () => {
    colorState.mode = 'light'
    const wrapper = await mountSuspended(AppGiscusComments, { props: { path: '/writing/first' } })
    expect(wrapper.element.querySelector('script')).not.toBeNull()

    // The container is keyed on path, so a client-side article-to-article
    // navigation tears down the div holding the giscus iframe. onMounted has
    // already run and will not run again, so without an explicit re-injection
    // the reader is left with a permanently blank comments block.
    await wrapper.setProps({ path: '/writing/second' })
    await nextTick()

    const script = wrapper.element.querySelector('script')
    expect(script).not.toBeNull()
    expect(script?.src).toBe('https://giscus.app/client.js')
  })

  it('uses the light theme stylesheet when color mode is light', async () => {
    colorState.mode = 'light'
    const wrapper = await mountSuspended(AppGiscusComments, { props: { path: '/writing/example' } })
    const script = wrapper.element.querySelector('script')
    expect(script?.getAttribute('data-theme')).toContain('giscus-theme-light.css')
  })

  it('posts a setConfig theme message to the giscus iframe when color mode changes', async () => {
    colorState.mode = 'light'
    await mountSuspended(AppGiscusComments, { props: { path: '/writing/example' }, attachTo: document.body })

    const iframe = document.createElement('iframe')
    iframe.classList.add('giscus-frame')
    document.body.appendChild(iframe)
    const postMessage = vi.fn()
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage }, configurable: true })

    colorState.mode = 'dark'
    await nextTick()

    expect(postMessage).toHaveBeenCalledWith(
      { giscus: { setConfig: { theme: expect.stringContaining('giscus-theme-dark.css') } } },
      'https://giscus.app',
    )
    iframe.remove()
  })

  it('does nothing when color mode changes but no giscus iframe is present yet', async () => {
    colorState.mode = 'light'
    await mountSuspended(AppGiscusComments, { props: { path: '/writing/example' } })
    colorState.mode = 'dark'
    await expect(nextTick()).resolves.toBeUndefined()
  })
})
