import { Feed } from 'feed'

export interface ArticleSummary {
  title: string
  path: string
  description: string
  date: string
  articleType: string
  categories: string[]
}

const SITE_URL = 'https://stuar.tc'
const AUTHOR = { name: 'Stuart Clark', email: 'stu@rtclark.net', link: SITE_URL }

export function isBlogPost(article: ArticleSummary): boolean {
  return article.articleType === 'Blog post'
}

// Restores the historical /planet-drupal.xml filter (a "Blog post" further
// tagged "Planet Drupal") used to syndicate to Drupal.org's Planet Drupal
// aggregator — see drupal/content taxonomy_term "Planet Drupal".
export function isPlanetDrupal(article: ArticleSummary): boolean {
  return isBlogPost(article) && article.categories.includes('Planet Drupal')
}

export function buildArticleFeed(articles: ArticleSummary[], options: { path: string, title: string, description: string }): string {
  const feedUrl = `${SITE_URL}${options.path}`
  const feed = new Feed({
    title: options.title,
    description: options.description,
    id: feedUrl,
    link: feedUrl,
    feed: feedUrl,
    feedLinks: { rss: feedUrl },
    copyright: `© ${new Date().getFullYear()} Stuart Clark`,
    author: AUTHOR,
  })

  for (const article of articles) {
    const url = `${SITE_URL}${article.path}`
    feed.addItem({
      title: article.title,
      id: url,
      link: url,
      description: article.description,
      author: [AUTHOR],
      date: new Date(article.date),
    })
  }

  return feed.rss2()
}
