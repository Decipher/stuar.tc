import { describe, it, expect, beforeEach } from 'vitest'

describe('buildSponsorUrl', () => {
  it('builds a URL with UTM params for open-source location', async () => {
    const { buildSponsorUrl } = await import('~/composables/useSponsorTracking')
    const url = buildSponsorUrl('open-source')
    expect(url).toContain('https://github.com/sponsors/Decipher?')
    expect(url).toContain('utm_source=stuar.tc')
    expect(url).toContain('utm_medium=web')
    expect(url).toContain('utm_campaign=sponsor')
    expect(url).toContain('utm_content=open-source')
  })

  it('builds a URL with UTM params for article-repo-card location', async () => {
    const { buildSponsorUrl } = await import('~/composables/useSponsorTracking')
    const url = buildSponsorUrl('article-repo-card')
    expect(url).toContain('utm_content=article-repo-card')
  })

  it('produces different URLs for different locations', async () => {
    const { buildSponsorUrl } = await import('~/composables/useSponsorTracking')
    expect(buildSponsorUrl('open-source')).not.toBe(buildSponsorUrl('article-repo-card'))
  })
})

describe('useSponsorTracking', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('returns a computed sponsorUrl with UTM params', async () => {
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { sponsorUrl } = useSponsorTracking('open-source')
    expect(sponsorUrl.value).toContain('utm_content=open-source')
    expect(sponsorUrl.value).toContain('utm_source=stuar.tc')
  })

  // The bug this guards against: pushing an array literal straight onto
  // window.dataLayer. gtag.js only dispatches queue entries that are genuine
  // `arguments` objects, so such a push is enqueued and then ignored forever —
  // no event in GA4, no error anywhere, and a unit test that asserts the
  // queue's *contents* still passes. sponsor_click sent nothing for the 400
  // days that code was live.
  //
  // Delivery itself cannot be asserted here: nuxt-gtag swaps in its no-op
  // `useGtagMock` whenever `gtag.enabled` is false, which is every environment
  // except production. So the guard is that the queue stays untouched — true
  // only when dispatch goes through nuxt-gtag.
  it('trackClick never writes to dataLayer directly', async () => {
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { trackClick } = useSponsorTracking('open-source')
    trackClick()
    trackClick('other-target')
    expect(window.dataLayer).toHaveLength(0)
  })

  it('trackClick is a no-op rather than a crash when GA4 is inactive', async () => {
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { trackClick } = useSponsorTracking('open-source')
    expect(() => trackClick()).not.toThrow()
    expect(() => trackClick('other-target')).not.toThrow()
  })

  it('does not throw when dataLayer is unavailable (dev/SSR)', async () => {
    // @ts-expect-error: intentionally delete to simulate dev without gtag
    delete window.dataLayer
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { trackClick } = useSponsorTracking('open-source')
    expect(() => trackClick()).not.toThrow()
  })
})
