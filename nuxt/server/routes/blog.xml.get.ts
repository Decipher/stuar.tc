import { defineEventHandler, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { buildArticleFeed, isBlogPost } from '../utils/articleFeed'

export default defineEventHandler(async (event) => {
  const articles = await queryCollection(event, 'articleEntries').order('date', 'DESC').all()

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildArticleFeed(articles.filter(isBlogPost), {
    path: '/blog.xml',
    title: 'Stuart Clark - Experimenting with Druxt',
    description: 'Stuart Clark\'s Blog feed.',
  })
})
