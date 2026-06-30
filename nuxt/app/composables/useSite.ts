import type { SiteConfig } from '~/data/site'
import { site } from '~/data/site'

/**
 * Site-wide configuration (name, tagline, socials, etc).
 *
 * @returns The singleton {@link SiteConfig} object.
 */
export function useSite(): SiteConfig {
  return site
}
