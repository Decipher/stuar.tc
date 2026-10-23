/**
 * GA4 event payloads for the "Read next" section at the end of each article.
 *
 * Split out from ``useRelatedTracking`` so the dispatch can be asserted
 * directly, for the same reason as ``sponsorEvents``: nuxt-gtag swaps in a
 * no-op ``useGtagMock`` everywhere but production, and that auto-import cannot
 * be intercepted, so ``gtag`` is taken as a parameter instead.
 */

/**
 * How a related post was chosen, as stored by ``scripts/sync-content.mjs``:
 * a manual pick in Drupal's ``field_related``, a result of the
 * ``related_articles`` view, or a latest-post fallback.
 */
export type RelatedSource = 'picked' | 'view' | 'latest'

/** One stored "Read next" entry, in display order. */
export interface RelatedEntry {
  /** The related article's path, e.g. ``/writing/hello-world-20211126``. */
  path: string
  /** How the entry was chosen. */
  source: RelatedSource
}

/**
 * The gtag call signature used here, narrowed to ``'event'`` so nuxt-gtag's
 * generic ``Gtag`` stays assignable to it (see ``SponsorGtagFn``).
 */
export type RelatedGtagFn =
  | ((command: 'event', name: string, params: Record<string, string | number>) => void)
  | undefined

/**
 * Fire the ``related_click`` GA4 event.
 *
 * Dispatches via gtag rather than pushing to ``window.dataLayer``: gtag.js
 * ignores queue entries that are not genuine ``arguments`` objects, which is
 * how ``sponsor_click`` once recorded nothing for 400 days.
 *
 * @param gtag - nuxt-gtag's dispatcher; undefined when GA4 is inactive.
 * @param position - The card's place in the section, 1 to 3.
 * @param source - How the clicked post was chosen.
 * @param target - The clicked post's path.
 */
export function trackRelatedClick(
  gtag: RelatedGtagFn,
  position: number,
  source: RelatedSource,
  target: string,
): void {
  gtag?.('event', 'related_click', { position, source, target })
}
