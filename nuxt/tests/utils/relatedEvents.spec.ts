// @vitest-environment happy-dom
// Opted out of the shared `nuxt` environment: this is a pure payload builder
// with no Nuxt runtime involved.
import { describe, it, expect, vi } from 'vitest'
import { trackRelatedClick } from '../../app/utils/relatedEvents'

describe('trackRelatedClick', () => {
  it('dispatches related_click with the position, source and target', () => {
    const gtag = vi.fn()
    trackRelatedClick(gtag, 2, 'view', '/writing/hello-world-20211126')
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'related_click', {
      position: 2,
      source: 'view',
      target: '/writing/hello-world-20211126',
    })
  })

  it('goes through gtag rather than writing to dataLayer', () => {
    window.dataLayer = []
    trackRelatedClick(vi.fn(), 1, 'picked', '/writing/x-20260101')
    expect(window.dataLayer).toHaveLength(0)
  })

  it('is a no-op rather than a crash when GA4 is inactive', () => {
    expect(() => trackRelatedClick(undefined, 1, 'latest', '/writing/x-20260101')).not.toThrow()
  })
})
