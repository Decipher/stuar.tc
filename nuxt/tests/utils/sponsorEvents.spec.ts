// @vitest-environment happy-dom
// Opted out of the shared `nuxt` environment: this is a pure payload builder
// with no Nuxt runtime involved.
import { describe, it, expect, vi } from 'vitest'
import { trackSponsorClick } from '../../app/utils/sponsorEvents'

describe('trackSponsorClick', () => {
  it('dispatches sponsor_click with the location and the default target', () => {
    const gtag = vi.fn()
    trackSponsorClick(gtag, 'open-source')
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'sponsor_click', {
      location: 'open-source',
      target: 'github-sponsors',
    })
  })

  it('dispatches sponsor_click for the article repo card', () => {
    const gtag = vi.fn()
    trackSponsorClick(gtag, 'article-repo-card')
    expect(gtag).toHaveBeenCalledWith('event', 'sponsor_click', {
      location: 'article-repo-card',
      target: 'github-sponsors',
    })
  })

  it('carries a custom target through', () => {
    const gtag = vi.fn()
    trackSponsorClick(gtag, 'article-repo-card', 'other-target')
    expect(gtag).toHaveBeenCalledWith('event', 'sponsor_click', {
      location: 'article-repo-card',
      target: 'other-target',
    })
  })

  it('goes through gtag rather than writing to dataLayer', () => {
    window.dataLayer = []
    const gtag = vi.fn()
    trackSponsorClick(gtag, 'open-source')
    // gtag.js ignores array literals pushed onto the queue, so a direct write
    // delivers nothing while looking like it worked.
    expect(window.dataLayer).toHaveLength(0)
  })

  it('is a no-op rather than a crash when GA4 is inactive', () => {
    expect(() => trackSponsorClick(undefined, 'open-source')).not.toThrow()
  })
})
