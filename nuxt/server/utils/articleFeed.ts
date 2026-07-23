import { Feed } from 'feed'
import { extractTeaser } from './extractTeaser'

export interface ArticleSummary {
  title: string
  path: string
  description: string
  date: string
  articleType: string
  categories: string[]
  /** Layout Paragraphs tree — used by ``extractTeaser`` to build feed body text. */
  paragraphs: unknown[]
}

export interface FeedOptions {
  /** Absolute origin serving the feed, e.g. ``https://stuar.tc`` or a tunnel. */
  baseUrl: string
  path: string
  title: string
  description: string
}

/**
 * Build the stable URL for a route's nuxt-og-image share card.
 *
 * nuxt-og-image (v6) serves each route's Satori-rendered share card at
 * ``/_og/d/{params}.png``. The params encode the ``StuartcOgImage`` component's
 * props — title and the canonical URL (both base64url, ``~``-prefixed so they
 * survive commas/special characters that would otherwise break the comma-delimited
 * param splitter), plus the eyebrow (a URL-safe path slug, kept raw) — mirroring
 * what each page passes to ``defineOgImage()``. The ``s_{hash}`` cache-busting
 * segment is optional for fetching (verified against the live renderer), so it
 * is omitted to keep the URL stable across OG-component edits.
 *
 * @param baseUrl - Absolute origin (no trailing slash).
 * @param title - The card headline (the page/article title).
 * @param canonicalUrl - The absolute canonical URL the card represents.
 * @param eyebrow - The `// eyebrow` label shown above the title (URL-safe slug).
 * @returns An absolute ``/_og/d/...png`` URL.
 */
function ogImageUrl(baseUrl: string, title: string, canonicalUrl: string, eyebrow: string): string {
  const b64 = (input: string): string => Buffer.from(input, 'utf-8').toString('base64url')
  const params = [
    'c_StuartcOgImage',
    `title_~${b64(title)}`,
    `value_~${b64(canonicalUrl)}`,
    `eyebrow_${eyebrow}`,
  ].join(',')
  return `${baseUrl}/_og/d/${params}.png`
}

export function isBlogPost(article: ArticleSummary): boolean {
  return article.articleType === 'Blog post'
}

// Restores the historical /planet-drupal.xml filter (a "Blog post" further
// tagged "Planet Drupal") used to syndicate to Drupal.org's Planet Drupal
// aggregator — see drupal/content taxonomy_term "Planet Drupal".
export function isPlanetDrupal(article: ArticleSummary): boolean {
  return isBlogPost(article) && article.categories.includes('Planet Drupal')
}

/**
 * Build an RSS 2.0 feed for the given articles.
 *
 * Every URL (channel link, self-reference, item links, and OG share-card
 * images) is derived from ``options.baseUrl`` so the feed is internally
 * consistent regardless of where it is served — a Cloudflare tunnel during
 * development or ``https://stuar.tc`` in production. The channel
 * ``<link>`` points at the open-source page, whose OG card serves as the
 * channel image; the ``feed`` library derives ``<image><link>`` from the
 * channel link, keeping the two in sync as the W3C feed validator requires.
 *
 * @param articles - Article summaries, newest first.
 * @param options - Feed configuration including the serving ``baseUrl``.
 * @returns A complete RSS 2.0 XML string.
 */
export function buildArticleFeed(articles: ArticleSummary[], options: FeedOptions): string {
  const { baseUrl } = options
  const ossUrl = `${baseUrl}/open-source`
  const author = { name: 'Stuart Clark', email: 'stu@rtclark.net', link: baseUrl }
  const feedUrl = `${baseUrl}${options.path}`

  const feed = new Feed({
    title: options.title,
    description: options.description,
    id: feedUrl,
    // <channel><link> = the open-source page. The `feed` library derives
    // <image><link> from this, keeping them in sync (W3C validator requirement).
    link: ossUrl,
    feed: feedUrl,
    feedLinks: { rss: feedUrl },
    image: ogImageUrl(baseUrl, 'Open source', ossUrl, 'open-source'),
    copyright: `© ${new Date().getFullYear()} Stuart Clark`,
    author,
  })

  for (const article of articles) {
    const url = `${baseUrl}${article.path}`
    feed.addItem({
      title: article.title,
      id: url,
      link: url,
      // Body teaser (~600 chars of prose + "Continue reading →" link) derived
      // from the article's Layout Paragraphs tree, matching Drupal core's
      // default RSS publishing convention.
      description: extractTeaser(article.paragraphs, url, article.description),
      author: [author],
      date: new Date(article.date),
      // The article's own OG share card (matches writing/[...slug].vue's
      // defineOgImage props: title + canonical URL + eyebrow "writing").
      image: ogImageUrl(baseUrl, article.title, url, 'writing'),
    })
  }

  return feed.rss2()
}
