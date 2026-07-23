import { defineEventHandler, getRequestURL, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { buildArticleFeed, isBlogPost } from '../utils/articleFeed'

export default defineEventHandler(async (event) => {
  const articles = await queryCollection(event, 'articleEntries').order('date', 'DESC').all()
  const baseUrl = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildArticleFeed(articles.filter(isBlogPost), {
    baseUrl,
    path: '/blog.xml',
    title: 'Stuart Clark - Experimenting with Druxt',
    description: 'Stuart Clark\'s Blog feed.',
  })
})
