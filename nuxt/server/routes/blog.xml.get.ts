import { defineEventHandler, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { SITE_ORIGIN } from '~/utils/socialMeta'
import { buildArticleFeed, isBlogPost } from '../utils/articleFeed'

export default defineEventHandler(async (event) => {
  const articles = await queryCollection(event, 'articleEntries').order('date', 'DESC').all()
  // Fixed, not request-derived — this route is prerendered, and deriving the
  // origin from the request bakes whatever host Nitro's internal prerender
  // crawler used (http://localhost:PORT) permanently into the static feed.
  const baseUrl = SITE_ORIGIN

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildArticleFeed(articles.filter(isBlogPost), {
    baseUrl,
    path: '/blog.xml',
    title: 'Stuart Clark - Experimenting with Druxt',
    description: 'Stuart Clark\'s Blog feed.',
  })
})
