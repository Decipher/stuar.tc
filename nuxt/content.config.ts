import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'page',
      source: {
        include: 'articles/**/*.md',
        prefix: '/writing',
      },
      schema: z.object({
        date: z.string(),
        title: z.string(),
        description: z.string().optional(),
        read: z.string(),
        tags: z.array(z.string()).default([]),
      }),
    }),
  },
})
