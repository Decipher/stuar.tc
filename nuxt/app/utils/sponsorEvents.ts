/**
 * GA4 event payloads for the sponsor CTAs.
 *
 * Split out from ``useSponsorTracking`` so the dispatch can be asserted directly.
 * The composable itself cannot be spied on: nuxt-gtag swaps in a no-op
 * ``useGtagMock`` whenever ``gtag.enabled`` is false, which is every
 * environment except production, and unimport injects that auto-import by
 * absolute path so neither ``mockNuxtImport`` nor ``vi.mock`` can intercept it.
 * Taking ``gtag`` as a parameter sidesteps all of that and follows the same
 * util-plus-thin-wrapper split already used for ``interpolation`` and
 * ``internalTraffic``.
 */

/**
 * The gtag call signature used here. Narrowed to ``'event'`` rather than
 * ``string`` so nuxt-gtag's generic ``Gtag``, whose command is constrained to
 * its own union, stays assignable to it.
 */
export type SponsorGtagFn =
  | ((command: 'event', name: string, params: Record<string, string>) => void)
  | undefined

/**
 * Fire the ``sponsor_click`` GA4 event.
 *
 * Dispatches via gtag rather than pushing to ``window.dataLayer`` directly:
 * gtag.js only processes queue entries that are genuine ``arguments`` objects,
 * so a pushed array literal is enqueued and then ignored. That is not
 * theoretical, it is why this event recorded nothing for 400 days.
 *
 * @param gtag - nuxt-gtag's dispatcher; undefined when GA4 is inactive.
 * @param location - Where on the site the CTA appears.
 * @param target - The destination. Defaults to ``'github-sponsors'``.
 */
export function trackSponsorClick(
  gtag: SponsorGtagFn,
  location: string,
  target = 'github-sponsors',
): void {
  gtag?.('event', 'sponsor_click', { location, target })
}
