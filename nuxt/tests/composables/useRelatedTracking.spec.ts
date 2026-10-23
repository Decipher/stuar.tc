import { describe, it, expect, beforeEach } from 'vitest'

describe('useRelatedTracking', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  // Delivery cannot be asserted here (nuxt-gtag's no-op mock is in place
  // outside production; see useSponsorTracking.spec.ts), so the guard is that
  // the queue stays untouched, which is only true when dispatch goes through
  // nuxt-gtag. The payload itself is asserted in utils/relatedEvents.spec.ts.
  it('trackClick never writes to dataLayer directly', async () => {
    const { useRelatedTracking } = await import('~/composables/useRelatedTracking')
    const { trackClick } = useRelatedTracking()
    trackClick(1, 'picked', '/writing/hello-world-20211126')
    expect(window.dataLayer).toHaveLength(0)
  })

  it('trackClick is a no-op rather than a crash when GA4 is inactive', async () => {
    // @ts-expect-error: intentionally delete to simulate dev without gtag
    delete window.dataLayer
    const { useRelatedTracking } = await import('~/composables/useRelatedTracking')
    const { trackClick } = useRelatedTracking()
    expect(() => trackClick(3, 'latest', '/writing/hello-world-20211126')).not.toThrow()
  })
})
