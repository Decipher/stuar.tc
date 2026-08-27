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
 * Dispatches through ``nuxt-gtag``'s ``gtag()`` helper rather than pushing to
 * ``window.dataLayer`` directly. That distinction is load-bearing: gtag.js only
 * processes queue entries that are genuine ``arguments`` objects, so a pushed
 * array literal is enqueued and then silently ignored — the event never reaches
 * GA4 and nothing anywhere reports an error.
 *
 * ``useGtag()`` is called here, during setup, so the returned ``trackClick`` is
 * a plain function safe to invoke from a click handler outside Nuxt's context.
 * ``gtag`` is a no-op on the server and a no-op when GA4 is inactive (dev,
 * preview), because ``window.dataLayer`` is undefined there.
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
  const { gtag } = useGtag()

  /**
   * Fire the ``sponsor_click`` GA4 event.
   *
   * @param target - The destination. Defaults to ``'github-sponsors'``.
   */
  function trackClick(target = 'github-sponsors') {
    gtag?.('event', 'sponsor_click', { location, target })
  }

  return {
    trackClick,
    sponsorUrl: computed(() => buildSponsorUrl(location)),
  }
}
