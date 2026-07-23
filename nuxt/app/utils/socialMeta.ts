/**
 * Pure helpers for deriving social-share metadata from a route path.
 *
 * Kept side-effect-free so they are trivially unit-testable (the 100% coverage
 * gate applies to `app/**`). {@link app/app.vue} wires them into the global
 * `defineOgImage` call reactively; the OG image component itself is purely
 * presentational.
 */

/** Canonical origin for stuar.tc. */
export const SITE_ORIGIN = 'https://stuar.tc'

/** Clean display titles keyed by exact route path (for the OG image H1). */
const ROUTE_TITLES: Record<string, string> = {
  '/': 'Stuart Clark',
  '/about': 'About',
  '/open-source': 'Open source',
  '/community': 'Community',
  '/uses': 'Uses',
  '/drupalgive': 'DrupalGive',
  '/styleguide': 'Styleguide',
  '/writing': 'Writing',
  '/photos': 'Photography',
}

/** Site-wide fallback description (the homepage bio). */
const SITE_DESCRIPTION = 'Senior Drupal & JavaScript engineer. Creator of DruxtJS. Doing Druxt.'

/** Section-specific descriptions, for routes worth describing more precisely
 * than the site-wide bio (for dynamic routes under a section, e.g. an
 * individual `/writing/[slug]` article, the page itself is expected to
 * override with its own specific description once its data loads). */
const ROUTE_DESCRIPTIONS: Record<string, string> = {
  '/writing': 'Notes on Druxt, decoupled Drupal, and whatever else comes up building this stuff for a living.',
}

/**
 * Resolve the canonical absolute URL for a path.
 *
 * @param path - The route path (e.g. `/about`, `/`).
 * @returns The absolute URL (e.g. `https://stuar.tc/about`).
 */
export function canonicalUrlForPath(path: string): string {
  return `${SITE_ORIGIN}${path === '' ? '/' : path}`
}

/**
 * Resolve a clean display title for the OG image for a path. Falls back to the
 * nearest known section title for dynamic routes (e.g. `/writing/[slug]`),
 * then to the site name.
 *
 * @param path - The route path.
 * @returns A title string.
 */
export function ogTitleForPath(path: string): string {
  const exact = ROUTE_TITLES[path]
  if (exact)
    return exact
  const first = path.split('/').filter(Boolean)[0]
  const segment = first ? `/${first}` : '/'
  return ROUTE_TITLES[segment] ?? 'Stuart Clark'
}

/**
 * Resolve a description for a path, for `og:description`/`twitter:description`.
 * Falls back to the nearest known section description for dynamic routes,
 * then to the site-wide bio.
 *
 * @param path - The route path.
 * @returns A description string.
 */
export function ogDescriptionForPath(path: string): string {
  const exact = ROUTE_DESCRIPTIONS[path]
  if (exact)
    return exact
  const first = path.split('/').filter(Boolean)[0]
  const segment = first ? `/${first}` : '/'
  return ROUTE_DESCRIPTIONS[segment] ?? SITE_DESCRIPTION
}

/**
 * Resolve the eyebrow label (the `// {segment}` line) for a path.
 *
 * @param path - The route path.
 * @returns The eyebrow segment, or `home` for the homepage.
 */
export function ogEyebrowForPath(path: string): string {
  const first = path.split('/').filter(Boolean)[0]
  return first ?? 'home'
}
