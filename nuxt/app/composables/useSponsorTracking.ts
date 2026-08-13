import type { ComputedRef } from 'vue'

/** Locations where code-controlled sponsor CTAs appear on the site. */
export type SponsorCtaLocation = 'open-source' | 'article-repo-card'

/**
 * Build the GitHub Sponsors URL with UTM campaign parameters for a given
 * CTA location.
 *
 * The UTM params let GA4 attribute the click to its origin page (via
 * ``utm_content``) and let GitHub's own referrer data distinguish stuar.tc
 * traffic from other sources.
 *
 * @param location - Where on the site the CTA appears; used as ``utm_content``.
 * @returns The GitHub Sponsors URL with UTM params appended.
 */
export function buildSponsorUrl(location: SponsorCtaLocation): string {
  const params = new URLSearchParams({
    utm_source: 'stuar.tc',
    utm_medium: 'web',
    utm_campaign: 'sponsor',
    utm_content: location,
  })
  return `https://github.com/sponsors/Decipher?${params}`
}

/**
 * Composable for tracking sponsor CTA clicks in GA4.
 *
 * Pushes a ``sponsor_click`` event to ``window.dataLayer`` (the GA4 command
 * queue that the gtag script processes). This is the same mechanism
 * ``nuxt-gtag`` uses internally. No-ops automatically when GA4 is not active
 * (dev, preview, SSR) because ``window.dataLayer`` is ``undefined`` in those
 * contexts and the optional chaining (``?.``) makes the push a no-op.
 *
 * @param location - Where on the site the CTA appears.
 * @returns An object with:
 *   - ``trackClick``: fires the GA4 ``sponsor_click`` event.
 *   - ``sponsorUrl``: computed ref of the UTM-tagged GitHub Sponsors URL.
 */
export function useSponsorTracking(location: SponsorCtaLocation): {
  trackClick: (target?: string) => void
  sponsorUrl: ComputedRef<string>
} {
  /**
   * Fire the ``sponsor_click`` GA4 event.
   *
   * @param target - The destination. Defaults to ``'github-sponsors'``.
   */
  function trackClick(target = 'github-sponsors') {
    window.dataLayer?.push(['event', 'sponsor_click', { location, target }])
  }

  return {
    trackClick,
    sponsorUrl: computed(() => buildSponsorUrl(location)),
  }
}
