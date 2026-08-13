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
    // GA4's dataLayer queue; trackClick pushes event arrays here.
    window.dataLayer = []
  })

  it('returns a computed sponsorUrl with UTM params', async () => {
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { sponsorUrl } = useSponsorTracking('open-source')
    expect(sponsorUrl.value).toContain('utm_content=open-source')
    expect(sponsorUrl.value).toContain('utm_source=stuar.tc')
  })

  it('trackClick pushes sponsor_click event with location and default target', async () => {
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { trackClick } = useSponsorTracking('open-source')
    trackClick()
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual(['event', 'sponsor_click', {
      location: 'open-source',
      target: 'github-sponsors',
    }])
  })

  it('trackClick accepts a custom target', async () => {
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { trackClick } = useSponsorTracking('article-repo-card')
    trackClick('other-target')
    expect(window.dataLayer[0]).toEqual(['event', 'sponsor_click', {
      location: 'article-repo-card',
      target: 'other-target',
    }])
  })

  it('does not throw when dataLayer is unavailable (dev/SSR)', async () => {
    // @ts-expect-error: intentionally delete to simulate dev without gtag
    delete window.dataLayer
    const { useSponsorTracking } = await import('~/composables/useSponsorTracking')
    const { trackClick } = useSponsorTracking('open-source')
    expect(() => trackClick()).not.toThrow()
  })
})
