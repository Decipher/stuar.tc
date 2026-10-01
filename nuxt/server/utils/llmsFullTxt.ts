/**
 * Builder for ``/llms-full.txt``: the site's pages and every article's full
 * text as one Markdown document, the companion to ``/llms.txt`` that
 * https://llmstxt.org describes.
 *
 * Articles are Layout Paragraphs trees, not Markdown, so this walks the same
 * structure ``extractTeaser`` does but keeps everything: no length limit, and
 * code, media and repository paragraphs are rendered rather than skipped,
 * since for an assistant the code is the most useful part of most posts.
 */

import type { ArticleSummary } from './articleFeed'
import { absoluteUrl, htmlToMarkdown, type HtmlToMarkdownOptions } from './htmlToMarkdown'
import { SITE_SUMMARY } from './llmsTxt'
import { buildPageDocuments, type PageDocument } from './llmsFullPages'

export interface LlmsFullTxtOptions {
  /** Absolute origin serving the file, e.g. ``https://stuar.tc``. */
  baseUrl: string
}

/**
 * UTM params on each article's ``Source:`` URL. Distinct from ``llms.txt``'s
 * ``utm_source`` so the two files can be told apart in GA4: this one is read
 * and quoted, that one is browsed.
 */
const UTM = new URLSearchParams({
  utm_source: 'llms-full-txt',
  utm_medium: 'ai',
  utm_campaign: 'syndication',
}).toString()

/**
 * Article titles are H2 under the file's H1, section titles H3, so an
 * ``<h2>`` written inside an article body is demoted one level to match.
 */
const HEADING_OFFSET = 1

/**
 * Structural view of a Layout Paragraphs node: only the fields rendered here.
 * The zod schema in ``content.schema.ts`` is the authority on the real shape.
 */
interface FullTextParagraph {
  type: string
  title?: string
  html?: string
  code?: string
  language?: string
  alt?: string
  caption?: string
  src?: string
  description?: string
  url?: string
  drupalUrl?: string
  link?: { href: string, label: string }
  regions?: Record<string, FullTextParagraph[]>
  content?: FullTextParagraph[]
  cards?: FullTextParagraph[]
}

/**
 * Fence a code block, with a fence longer than any backtick run inside it.
 *
 * @param code - The code, verbatim.
 * @param language - Info-string language, if known.
 * @returns A fenced Markdown code block.
 */
function fence(code: string, language: string | undefined): string {
  const longest = Math.max(0, ...(code.match(/`{3,}/g) ?? []).map(run => run.length))
  const marks = '`'.repeat(Math.max(3, longest + 1))
  return `${marks}${language ?? ''}\n${code.replace(/\n$/, '')}\n${marks}`
}

/**
 * Render one paragraph, and whatever it nests, as Markdown blocks.
 *
 * @param paragraph - A paragraph node.
 * @param options - Conversion options.
 * @returns Zero or more Markdown blocks, in reading order.
 */
function renderParagraph(paragraph: FullTextParagraph, options: HtmlToMarkdownOptions): string[] {
  const md = (html: string | undefined) => htmlToMarkdown(html ?? '', options)
  const link = (target: { href: string, label: string }) => `[${target.label}](${absoluteUrl(target.href, options.baseUrl)})`
  const children = (nodes: FullTextParagraph[]) => nodes.flatMap(child => renderParagraph(child, options))
  const titled = (title: string | undefined, prefix: string, suffix = '') => title ? [`${prefix}${title}${suffix}`] : []

  switch (paragraph.type) {
    case 'text_formatted':
      return [md(paragraph.html)]
    case 'code':
      // Titles are captions, not always file names ("Install", "GET /jsonapi/...").
      return [...titled(paragraph.title, '**', '**'), fence(paragraph.code!, paragraph.language)]
    case 'media':
      return [`![${paragraph.alt}](${absoluteUrl(paragraph.src!, options.baseUrl)})`, md(paragraph.caption)]
    case 'repository':
      return [md(paragraph.description), [
        `- Source: ${paragraph.url}`,
        ...(paragraph.drupalUrl ? [`- Drupal.org: ${paragraph.drupalUrl}`] : []),
      ].join('\n')]
    case 'section':
      return [...titled(paragraph.title, '### '), ...children(Object.values(paragraph.regions!).flat())]
    case 'card':
      return [...titled(paragraph.title, '#### '), md(paragraph.description), ...(paragraph.link ? [link(paragraph.link)] : [])]
    case 'card_group':
      return children(paragraph.cards!)
    case 'jumbotron':
      return [...titled(paragraph.title, '#### '), ...children(paragraph.content!)]
    case 'link':
      return [link(paragraph.link!)]
    default:
      // The content schema rejects unknown bundles, so this only guards a
      // schema change landing before the renderer does: drop it, not crash.
      return []
  }
}

/**
 * Render one document, an article or a page, as a self-contained section of
 * the file.
 *
 * The rule between documents is the reliable boundary, since bodies carry
 * headings of their own. The ``Source:`` line gives an assistant quoting this
 * file the page's URL to cite, rather than the concatenation.
 *
 * @param document - Title, path, summary, an optional publication date, and
 *   the body as Markdown blocks.
 * @param baseUrl - Absolute origin for the source URL.
 * @returns The document's Markdown.
 */
function renderDocument(document: PageDocument & { published?: string }, baseUrl: string): string {
  const source = `Source: ${baseUrl}${document.path}?${UTM}`
  return [
    '---',
    `## ${document.title}`,
    document.published ? `${source}\nPublished: ${document.published}` : source,
    `> ${document.description}`,
    ...document.body.filter(Boolean),
  ].join('\n\n')
}

/**
 * Turn an article into a document, rendering its paragraph tree.
 *
 * @param article - The article.
 * @param options - Conversion options.
 * @returns The article as a document with a publication date.
 */
function articleDocument(article: ArticleSummary, options: HtmlToMarkdownOptions): PageDocument & { published: string } {
  return {
    path: article.path,
    title: article.title,
    description: article.description,
    published: article.date.slice(0, 10),
    body: (article.paragraphs as FullTextParagraph[]).flatMap(paragraph => renderParagraph(paragraph, options)),
  }
}

/**
 * Render the full ``/llms-full.txt`` document.
 *
 * @param articles - Articles to include, already filtered and ordered by caller.
 * @param options - Origin to build absolute URLs against.
 * @returns The complete file contents, newline terminated.
 */
export function buildLlmsFullTxt(articles: ArticleSummary[], options: LlmsFullTxtOptions): string {
  const { baseUrl } = options
  const renderOptions = { baseUrl, headingOffset: HEADING_OFFSET }

  return [
    '# stuar.tc: full text',
    `> ${SITE_SUMMARY}`,
    `Everything on stuar.tc in full: who Stuart is, what he maintains and where he has spoken, then every article, newest first. Each document starts after a horizontal rule, with its title as an H2 and a \`Source:\` line giving its URL: cite that, not this file. The index of the site is at ${baseUrl}/llms.txt.`,
    ...buildPageDocuments().map(page => renderDocument(page, baseUrl)),
    ...articles.map(article => renderDocument(articleDocument(article, renderOptions), baseUrl)),
  ].join('\n\n') + '\n'
}
