import { defineContentConfig, defineCollection } from '@nuxt/content'
import { articleEntrySchema } from './content.schema'

export default defineContentConfig({
  collections: {
    articleEntries: defineCollection({
      type: 'data',
      source: 'articles-data/**/*.json',
      schema: articleEntrySchema,
    }),
  },
})
