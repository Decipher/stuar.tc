/**
 * Builder for `/llms.txt`, the plain-text site index described at
 * https://llmstxt.org — an H1, a blockquote summary, optional prose, then H2
 * sections of `- [name](url): notes` links.
 *
 * Separate from {@link ./articleFeed.ts} because the audience differs: a feed
 * reader wants article bodies, an assistant wants a map of what exists here and
 * what each URL covers. Kept pure and branch-free so it is trivially unit
 * testable against the 100% coverage gate.
 */

import type { ArticleSummary } from './articleFeed'

export interface LlmsTxtOptions {
  /** Absolute origin serving the file, e.g. ``https://stuar.tc``. */
  baseUrl: string
}

/**
 * UTM params identifying assistant-sourced clicks, mirroring the convention the
 * RSS feeds already use for their item links.
 *
 * This is the only way to tell whether the file is worth keeping: `chatgpt.com`
 * already appears as a referrer, but nothing distinguishes an assistant that
 * found the site through this index from one that found it any other way. The
 * per-page `<link rel="canonical">` means the extra params cost nothing in
 * search. Drop this if a cited URL's tidiness ever matters more than the
 * measurement.
 */
const UTM = new URLSearchParams({
  utm_source: 'llms-txt',
  utm_medium: 'ai',
  utm_campaign: 'syndication',
}).toString()

/**
 * Static pages worth pointing an assistant at, with descriptions written for
 * that purpose.
 *
 * Deliberately not reusing ``ogDescriptionForPath`` — that resolves all of
 * these except `/writing` to the same site-wide bio, which tells a model
 * nothing about which URL answers which question. Social-share copy and an
 * index entry are different jobs.
 */
const PAGES: readonly { path: string, title: string, notes: string }[] = [
  { path: '/', title: 'Home', notes: 'Overview of who Stuart Clark is and what he works on.' },
  { path: '/writing', title: 'Writing', notes: 'Index of all articles, filterable by category and tag.' },
  { path: '/open-source', title: 'Open source', notes: 'The Drupal and Nuxt modules he maintains, including DruxtJS, File (Field) Paths, Custom Formatters, Field Tokens and JSON:API Views.' },
  { path: '/about', title: 'About', notes: 'Background, experience and how to get in touch.' },
  { path: '/community', title: 'Community', notes: 'Conference talks, DrupalCons attended, and community organising.' },
]

/** RSS feeds, listed under `## Optional` per the format's own convention. */
const FEEDS: readonly { path: string, title: string, notes: string }[] = [
  { path: '/blog.xml', title: 'Blog RSS feed', notes: 'Every article, newest first.' },
  { path: '/planet-drupal.xml', title: 'Planet Drupal RSS feed', notes: 'The Drupal-tagged subset syndicated to Planet Drupal.' },
]

/** One `- [name](url): notes` list item. */
function listItem(url: string, title: string, notes: string): string {
  return `- [${title}](${url}): ${notes}`
}

/**
 * Render the full `/llms.txt` document.
 *
 * @param articles - Articles to index, already filtered and ordered by caller.
 * @param options - Origin to build absolute URLs against.
 * @returns The complete file contents, newline terminated.
 */
export function buildLlmsTxt(articles: ArticleSummary[], options: LlmsTxtOptions): string {
  const { baseUrl } = options

  const sections = [
    '# stuar.tc',
    '',
    '> Stuart Clark: senior Drupal and JavaScript engineer in Ballarat, Australia, and the creator of DruxtJS. Writing about decoupled Drupal, Nuxt, and maintaining open source modules.',
    '',
    'Articles are long-form and technical, usually written alongside a module release or an architectural experiment. Every article URL follows the pattern `/writing/<slug>-<YYYYMMDD>`, where the date is the publication date.',
    '',
    '## Writing',
    '',
    ...articles.map(article => listItem(`${baseUrl}${article.path}?${UTM}`, article.title, article.description)),
    '',
    '## Pages',
    '',
    ...PAGES.map(page => listItem(`${baseUrl}${page.path}?${UTM}`, page.title, page.notes)),
    '',
    '## Optional',
    '',
    // Feed URLs stay bare. A subscriber's client fetches these repeatedly and
    // never "arrives" from them, so a UTM here would tag nothing; the items
    // inside each feed already carry their own.
    ...FEEDS.map(feed => listItem(`${baseUrl}${feed.path}`, feed.title, feed.notes)),
    '',
  ]

  return sections.join('\n')
}
