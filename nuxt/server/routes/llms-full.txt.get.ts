import { defineEventHandler, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { SITE_ORIGIN } from '~/utils/socialMeta'
import { isBlogPost } from '../utils/articleFeed'
import { buildLlmsFullTxt } from '../utils/llmsFullTxt'

export default defineEventHandler(async (event) => {
  const articles = await queryCollection(event, 'articleEntries').order('date', 'DESC').all()
  // Fixed origin, and a plain-text content type, for the reasons given in
  // llms.txt.get.ts: this is prerendered, and should render inline.
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return buildLlmsFullTxt(articles.filter(isBlogPost), { baseUrl: SITE_ORIGIN })
})
