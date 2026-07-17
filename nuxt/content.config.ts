import { defineContentConfig, defineCollection, z } from '@nuxt/content'

// Mirrors the paragraph bundle types drupal/scripts/sync-content.mjs emits
// (buildParagraph()) — the 5 Layout Paragraphs bundles actually used across
// the site's articles. `section` nests other paragraphs by region, so its
// schema is self-referential via z.lazy().
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
  ]),
)

export default defineContentConfig({
  collections: {
    articleEntries: defineCollection({
      type: 'data',
      source: 'articles-data/**/*.json',
      schema: z.object({
        title: z.string(),
        path: z.string(),
        date: z.string(),
        description: z.string(),
        readingTime: z.string(),
        articleType: z.string(),
        categories: z.array(z.string()),
        paragraphs: z.array(paragraphSchema),
      }),
    }),
  },
})
