import { z } from '@nuxt/content'
import { defineSitemapSchema } from '@nuxtjs/sitemap/content'

// Mirrors the paragraph bundle types nuxt/scripts/sync-content.mjs emits
// (buildParagraph()) — every paragraph bundle Drupal's field_content
// allows (see SUPPORTED_PARAGRAPH_BUNDLES in sync-content.mjs and
// checkParagraphSchema(), which warns if Drupal's schema ever grows a
// bundle not listed here). `section`/`jumbotron`/`card_group` nest other
// paragraphs, so the schema is self-referential via z.lazy().
//
// Kept in a plain module separate from content.config.ts (which wraps it in
// `defineCollection()`) because `defineCollection()` calls into
// @nuxt/content's zod-to-json-schema conversion as a side effect, which only
// works inside a full Nuxt build context — importing content.config.ts
// directly from a plain Vitest test throws. This file has no such
// dependency, so tests/content/articles-data.spec.ts can import
// `articleEntrySchema` from here and run real, enforced `.safeParse()`
// validation against every article file, independent of whatever
// @nuxt/content itself does or doesn't enforce at runtime (confirmed it
// does not: a deliberately broken `path` was accepted into the content
// database with no error).
const linkSchema = z.object({
  href: z.string(),
  label: z.string(),
})

const cardSchema = z.object({
  type: z.literal('card'),
  title: z.string().optional(),
  description: z.string(),
  image: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  link: linkSchema.optional(),
})

const paragraphSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text_formatted'),
      html: z.string(),
    }),
    z.object({
      type: z.literal('code'),
      title: z.string().optional(),
      code: z.string(),
    }),
    z.object({
      type: z.literal('repository'),
      description: z.string(),
      url: z.string(),
      gitpod: z.boolean(),
      // Populated from Drupal's `field_drupal_url` (a Link field on the
      // `repository` paragraph bundle) by sync-content.mjs — optional since
      // not every repository has a Drupal.org project page.
      drupalUrl: z.string().optional(),
    }),
    z.object({
      type: z.literal('media'),
      alt: z.string(),
      caption: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      src: z.string(),
    }),
    z.object({
      type: z.literal('section'),
      title: z.string().optional(),
      layout: z.string(),
      regions: z.record(z.string(), z.array(paragraphSchema)),
    }),
    cardSchema,
    z.object({
      type: z.literal('card_group'),
      cards: z.array(cardSchema),
    }),
    z.object({
      type: z.literal('jumbotron'),
      title: z.string().optional(),
      content: z.array(paragraphSchema),
    }),
    z.object({
      type: z.literal('link'),
      link: linkSchema,
    }),
  ]),
)

// Articles published in the current year or the preceding year are
// considered "recent" for sitemap priority purposes. This auto-advances
// each calendar year so fresh content always gets the higher priority
// without manual threshold bumps.
const RECENT_ARTICLE_YEAR_THRESHOLD = new Date().getFullYear() - 1

/**
 * Derive sitemap ``<lastmod>``, ``<priority>``, and ``<changefreq>`` for an
 * article from its ``date`` field (the Drupal ``field_published`` timestamp,
 * synced as a full ISO 8601 string).
 *
 * - ``lastmod``: set to the publish date. A reasonable proxy for the true
 *   modification date without requiring a sync-script change to map Drupal's
 *   ``changed`` field.
 * - ``priority``: 0.6 for recent articles, 0.3 for older ones, so Google
 *   focuses crawl budget on fresh content.
 * - ``changefreq``: ``monthly`` for recent articles (may receive edits),
 *   ``yearly`` for historical content.
 *
 * @param date - ISO 8601 timestamp string from the article's ``date`` field.
 * @returns Sitemap entry metadata ({ lastmod, priority, changefreq }).
 */
export function deriveArticleSitemapMeta(date: string) {
  const year = Number.parseInt(date.slice(0, 4), 10)
  const isRecent = year >= RECENT_ARTICLE_YEAR_THRESHOLD
  return {
    lastmod: new Date(date),
    priority: isRecent ? 0.6 : 0.3,
    changefreq: isRecent ? 'monthly' as const : 'yearly' as const,
  }
}

// Enforces the pathauto convention every real article gets
// (`writing/<title-slug>-<created:Ymd>`, e.g. `/writing/hello-world-20211126`)
// — Drupal's own computed alias for synced content, or the hand-rolled
// slugify() fallback for anything without one yet.
export const articleEntrySchema = z.object({
  title: z.string(),
  path: z.string().regex(/^\/writing\/[a-z0-9]+(?:-[a-z0-9]+)*-\d{8}$/, 'article path must be /writing/<slug>-<YYYYMMDD>'),
  // Full ISO 8601 timestamp (not truncated to a date) — two articles
  // can share the same calendar day but genuinely different
  // publish times, and truncating loses the only thing that sorts
  // them correctly. Display code is responsible for formatting this
  // down to just the date portion.
  date: z.string(),
  description: z.string(),
  readingTime: z.string(),
  articleType: z.string(),
  categories: z.array(z.string()),
  paragraphs: z.array(paragraphSchema),
  // @nuxtjs/sitemap needs this field. Without it, the module skips this
  // collection entirely. .default({}) gives every article a value, even
  // when its JSON file has none. The onUrl callback (registered via
  // defineSitemapSchema below) derives per-article <lastmod>, <priority>,
  // and <changefreq> from the date field at sitemap-generation time.
  //
  // The module's content:file:afterParse hook runs before the zod schema
  // transform, so a .transform() approach does not populate the sitemap
  // field at the right time. onUrl is the module's supported extension
  // point for per-entry metadata.
  //
  // The onUrl callback inlines the same logic as deriveArticleSitemapMeta()
  // (exported above for unit testing) because the module serializes the
  // callback via .toString() into a Nitro virtual module at build time —
  // it cannot reference module-scope functions or closures.
  sitemap: defineSitemapSchema({
    z,
    name: 'articleEntries',
    onUrl: (url: Record<string, unknown>, data: { date?: string }) => {
      if (typeof data.date !== 'string') return
      const year = Number.parseInt(data.date.slice(0, 4), 10)
      const isRecent = year >= new Date().getFullYear() - 1
      url.lastmod = new Date(data.date)
      url.priority = isRecent ? 0.6 : 0.3
      url.changefreq = isRecent ? 'monthly' : 'yearly'
    },
  }).default({}),
})
