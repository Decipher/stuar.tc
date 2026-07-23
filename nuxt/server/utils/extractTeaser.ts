/**
 * Build an RSS ``<description>`` teaser from an article's Layout Paragraphs tree.
 *
 * Drupal core's default RSS publishing truncates each item to ~600 characters
 * of body content and appends a "Read more" link — the de-facto standard across
 * the Drupal community and the Planet Drupal aggregator. This function mirrors
 * that convention: it walks the recursive Layout Paragraphs structure, collecting
 * ``text_formatted`` HTML blocks (the article's prose) until roughly 600
 * characters of visible text have been gathered, then appends a
 * "Continue reading →" link so readers click through to the full article (and
 * its sponsorship/donation block).
 *
 * Non-prose paragraph types (``code``, ``media``, ``repository``, ``link``)
 * are skipped so the teaser reads as clean introductory text.
 */

/** Drupal core's default RSS publishing trim length (characters). */
const TEASER_LIMIT = 600

/**
 * Structural view of a Layout Paragraphs node — only the fields this walker
 * needs. The real zod-inferred discriminated union is wider, but ``unknown[]``
 * at the call site keeps the feed builder decoupled from the content schema.
 */
interface FeedParagraph {
  type: string
  html?: string
  regions?: Record<string, FeedParagraph[]>
  content?: FeedParagraph[]
  cards?: FeedParagraph[]
}

/**
 * Recursively collect ``text_formatted`` HTML from a paragraph tree.
 *
 * Prose lives in ``text_formatted.html``. ``section`` nodes nest children in
 * ``regions`` (a map of region-name → paragraph array); ``jumbotron`` and
 * ``card_group`` nest via ``content`` / ``cards`` respectively. All other types
 * (``code``, ``media``, ``repository``, ``link``) are ignored — they aren't
 * introductory prose.
 *
 * Drupal exports embed ``&#13;`` (carriage-return) entities throughout the HTML;
 * these are stripped here so the teaser renders cleanly in feed readers.
 *
 * @param paragraph - A single paragraph node (may be undefined/null).
 * @param acc - Accumulator array for collected HTML strings.
 */
function collectHtml(paragraph: FeedParagraph | undefined | null, acc: string[]): void {
  if (!paragraph) return

  if (paragraph.type === 'text_formatted' && paragraph.html) {
    acc.push(paragraph.html.replace(/&#13;/g, ''))
    return
  }

  if (paragraph.type === 'section' && paragraph.regions) {
    for (const region of Object.values(paragraph.regions)) {
      for (const child of region) collectHtml(child, acc)
    }
    return
  }

  if (paragraph.content) {
    for (const child of paragraph.content) collectHtml(child, acc)
    return
  }

  if (paragraph.cards) {
    for (const child of paragraph.cards) collectHtml(child, acc)
  }
}

/**
 * Count the visible text characters in an HTML string (tags stripped).
 *
 * Used to gauge teaser length the same way Drupal core does — by visible
 * text, not markup — so truncation lands at ~600 characters of prose.
 *
 * @param html - An HTML fragment.
 * @returns The number of characters of visible text.
 */
function plainTextLength(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
}

/**
 * Build the RSS teaser HTML for a single article.
 *
 * Walks the ``paragraphs`` tree, accumulates ``text_formatted`` HTML blocks
 * until ``TEASER_LIMIT`` characters of visible text are reached (whole-block
 * granularity — no mid-paragraph cuts), then appends a
 * "Continue reading →" link pointing at the full article.
 *
 * If the article has no ``text_formatted`` blocks at all (e.g. only code/media),
 * the provided ``fallback`` summary is used so the feed item isn't a bare link.
 *
 * @param paragraphs - The article's ``paragraphs`` array (Layout Paragraphs tree).
 * @param articleUrl - Absolute URL of the full article (for the read-more link).
 * @param fallback - Short summary used when no ``text_formatted`` blocks are found.
 * @returns An HTML string suitable for an RSS ``<description>`` element.
 */
export function extractTeaser(paragraphs: unknown[], articleUrl: string, fallback: string): string {
  const blocks: string[] = []
  for (const p of paragraphs) collectHtml(p as FeedParagraph, blocks)

  const teaser: string[] = []
  let charCount = 0
  for (const block of blocks) {
    teaser.push(block)
    charCount += plainTextLength(block)
    if (charCount >= TEASER_LIMIT) break
  }

  // No prose found — fall back to the article description so the item
  // isn't a bare read-more link.
  if (teaser.length === 0) {
    return `<p>${fallback}</p>\n<p><a href="${articleUrl}">Continue reading →</a></p>`
  }

  teaser.push(`<p><a href="${articleUrl}">Continue reading →</a></p>`)
  return teaser.join('\n')
}
