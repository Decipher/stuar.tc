import { defineContentConfig, defineCollection } from '@nuxt/content'
import { articleEntrySchema } from './content.schema'

export default defineContentConfig({
  collections: {
    articleEntries: defineCollection({
      type: 'data',
      source: 'articles-data/**/*.json',
      schema: articleEntrySchema,
    }),
    // Rendered from the repo-root CHANGELOG.md, copied in by
    // scripts/sync-changelog.mjs (see its `pre*` package.json hooks). No
    // custom schema needed — the built-in page schema already supplies
    // path/title/description/body.
    changelog: defineCollection({
      type: 'page',
      source: 'changelog.md',
    }),
  },
})
