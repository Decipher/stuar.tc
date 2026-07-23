import { z } from '@nuxt/content'

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
      // Not yet populated by sync-content.mjs — Drupal's `repository`
      // paragraph bundle needs a matching field before real synced content
      // can set this; for now it's hand-authored JSON only.
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
})
