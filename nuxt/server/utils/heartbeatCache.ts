import { setResponseHeaders } from 'h3'
import type { H3Event } from 'h3'

/**
 * Cache headers for the Heartbeat's live routes (`/api/activity-gh`,
 * `/api/activity-devnull`). In production these run as Netlify Functions;
 * letting the CDN hold a response for a few minutes means client refreshes
 * don't call GitHub or dev-null.sh on every page view. Browsers keep it for
 * a minute; Netlify's CDN for five, serving stale for up to ten more while
 * it revalidates.
 */
export const HEARTBEAT_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
} as const

/**
 * Applies {@link HEARTBEAT_CACHE_HEADERS} to a response.
 *
 * @param event - The request event.
 */
export function setHeartbeatCacheHeaders(event: H3Event): void {
  setResponseHeaders(event, HEARTBEAT_CACHE_HEADERS)
}
