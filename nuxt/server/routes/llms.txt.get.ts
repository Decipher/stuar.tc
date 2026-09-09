import { defineEventHandler, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { SITE_ORIGIN } from '~/utils/socialMeta'
import { isBlogPost } from '../utils/articleFeed'
import { buildLlmsTxt } from '../utils/llmsTxt'

export default defineEventHandler(async (event) => {
  const articles = await queryCollection(event, 'articleEntries').order('date', 'DESC').all()
  // Fixed, not request-derived — same reasoning as the RSS routes: this is
  // prerendered, and deriving the origin from the request would bake Nitro's
  // internal crawler host (http://localhost:PORT) into the static file.
  const baseUrl = SITE_ORIGIN

  // text/plain rather than text/markdown so browsers render it inline instead
  // of offering a download; the content is still Markdown, as the format wants.
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return buildLlmsTxt(articles.filter(isBlogPost), { baseUrl })
})
