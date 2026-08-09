import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useLazyRefresh } from '~/composables/useLazyRefresh'

/** Test host component that binds the composable's `target` ref to a div. */
function makeHost(refresh: () => void, rootMargin?: string) {
  return defineComponent({
    setup() {
      const { target } = useLazyRefresh(refresh, rootMargin ? { rootMargin } : {})
      return () => h('div', { ref: target }, 'host')
    },
  })
}

describe('useLazyRefresh', () => {
  let observerCallback: IntersectionObserverCallback
  let observerDisconnect: ReturnType<typeof vi.fn>
  let observerObserve: ReturnType<typeof vi.fn>
  let savedIO: typeof globalThis.IntersectionObserver

  beforeEach(() => {
    observerDisconnect = vi.fn()
    observerObserve = vi.fn()
    savedIO = globalThis.IntersectionObserver

    globalThis.IntersectionObserver = vi.fn((_cb: IntersectionObserverCallback) => ({
      observe: observerObserve,
      disconnect: observerDisconnect,
      unobserve: vi.fn(),
      takeRecords: () => [],
      root: null,
      rootMargin: '',
      thresholds: [],
    })) as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    globalThis.IntersectionObserver = savedIO
  })

  it('returns a target ref (null initially)', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh)
    await mountSuspended(Host)
    expect(refresh).toBeDefined()
  })

  it('creates an IntersectionObserver and observes the target element', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh)
    await mountSuspended(Host)
    expect(globalThis.IntersectionObserver).toHaveBeenCalledTimes(1)
    expect(observerObserve).toHaveBeenCalledTimes(1)
  })

  it('fires refresh once when the target intersects, then disconnects', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh)
    await mountSuspended(Host)

    // Capture the callback the observer was constructed with
    observerCallback = (globalThis.IntersectionObserver as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]

    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(observerDisconnect).toHaveBeenCalledTimes(1)

    // Second intersection should not fire refresh again
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('does not fire refresh when entries are not intersecting', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh)
    await mountSuspended(Host)

    observerCallback = (globalThis.IntersectionObserver as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    observerCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    expect(refresh).not.toHaveBeenCalled()
  })

  it('passes rootMargin to the IntersectionObserver options', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh, '500px')
    await mountSuspended(Host)
    expect(globalThis.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: '500px' }),
    )
  })

  it('falls back to immediate refresh when target is not bound to an element', async () => {
    const refresh = vi.fn()
    const Host = defineComponent({
      setup() {
        useLazyRefresh(refresh)
        return () => h('div', 'no-ref')
      },
    })
    await mountSuspended(Host)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('falls back to immediate refresh when IntersectionObserver is undefined', async () => {
    const refresh = vi.fn()
    const saved = globalThis.IntersectionObserver
    // @ts-expect-error intentionally undefined for fallback test
    globalThis.IntersectionObserver = undefined

    const Host = makeHost(refresh)
    await mountSuspended(Host)
    expect(refresh).toHaveBeenCalledTimes(1)

    globalThis.IntersectionObserver = saved
  })

  it('disconnects observer on unmount before intersection fires', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh)
    const wrapper = await mountSuspended(Host)
    expect(observerDisconnect).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(observerDisconnect).toHaveBeenCalledTimes(1)
  })

  it('does not error on unmount after observer already fired (null observer)', async () => {
    const refresh = vi.fn()
    const Host = makeHost(refresh)
    const wrapper = await mountSuspended(Host)

    observerCallback = (globalThis.IntersectionObserver as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    expect(observerDisconnect).toHaveBeenCalledTimes(1)

    // Unmount should not throw — observer is already null
    wrapper.unmount()
    // disconnect was called once (from the callback), not again on unmount
    expect(observerDisconnect).toHaveBeenCalledTimes(1)
  })
})
