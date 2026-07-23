import type { ComputedRef } from 'vue'
import { SITE_ORIGIN } from '~/utils/socialMeta'

/**
 * Request-aware absolute URL for the current route, for OG share cards.
 *
 * The OG share card's QR code and URL caption should point to the URL the
 * visitor is actually using — a Cloudflare tunnel in development,
 * ``https://stuar.tc`` in production. The origin is derived from the serving
 * request via ``useRequestURL()`` (which respects ``x-forwarded-host`` /
 * ``x-forwarded-proto``), matching the behaviour nuxt-og-image already provides
 * for the ``og:image`` host.
 *
 * Falls back to the production canonical origin for localhost requests (local
 * dev without a tunnel, or SSG prerender against the loopback) so the QR code
 * never encodes a throwaway host.
 *
 * @returns A computed ref of ``${origin}${route.path}``.
 */
export function useShareUrl(): ComputedRef<string> {
  const route = useRoute()
  const { hostname, origin } = useRequestURL()
  const shareOrigin = hostname === 'localhost' || hostname === '127.0.0.1'
    ? SITE_ORIGIN
    : origin
  return computed(() => `${shareOrigin}${route.path || '/'}`)
}
