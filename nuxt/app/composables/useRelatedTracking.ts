import type { RelatedSource } from '~/utils/relatedEvents'
import { trackRelatedClick } from '~/utils/relatedEvents'

/**
 * Composable for tracking "Read next" card clicks in GA4.
 *
 * Mirrors ``useSponsorTracking``: ``useGtag()`` is called during setup so the
 * returned ``trackClick`` is a plain function, safe to call from a click
 * handler outside Nuxt's context. ``gtag`` is a no-op on the server and
 * whenever GA4 is inactive (dev, preview).
 *
 * @returns An object with ``trackClick``, which fires the GA4
 *   ``related_click`` event.
 */
export function useRelatedTracking(): {
  trackClick: (position: number, source: RelatedSource, target: string) => void
} {
  const { gtag } = useGtag()

  /**
   * Fire the ``related_click`` GA4 event.
   *
   * @param position - The card's place in the section, 1 to 3.
   * @param source - How the clicked post was chosen.
   * @param target - The clicked post's path.
   */
  function trackClick(position: number, source: RelatedSource, target: string) {
    trackRelatedClick(gtag, position, source, target)
  }

  return { trackClick }
}
