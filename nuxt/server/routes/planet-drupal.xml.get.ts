import { defineEventHandler, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { buildArticleFeed, isPlanetDrupal } from '../utils/articleFeed'

export default defineEventHandler(async (event) => {
  const articles = await queryCollection(event, 'articleEntries').order('date', 'DESC').all()

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildArticleFeed(articles.filter(isPlanetDrupal), {
    path: '/planet-drupal.xml',
    title: 'Stuart Clark - Experimenting with Druxt',
    description: 'Stuart Clark\'s Planet Drupal feed.',
  })
})
