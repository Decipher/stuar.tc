/**
 * Convert the filtered HTML that Drupal stores in ``text_formatted``
 * paragraphs into Markdown, for ``/llms-full.txt``.
 *
 * Hand-rolled rather than a dependency because the input is narrow and
 * known: CKEditor output limited to ``p``, ``h2``-``h6``, ``ul``/``ol``/``li``,
 * ``blockquote``, ``a``, ``strong``, ``em`` and ``code``, with ``href`` as the
 * only attribute anywhere in the synced content. Anything else degrades to
 * its text, which is the right failure for a plain-text file.
 *
 * Not to be confused with ``extractTeaser``'s ``plainTextLength``, which
 * collapses all whitespace and so would wreck anything structural.
 */

export interface HtmlToMarkdownOptions {
  /** Absolute origin that root-relative links and images resolve against. */
  baseUrl: string
  /**
   * Levels to demote headings by, so an ``<h2>`` in an article body sits below
   * the heading the caller gives the article itself.
   */
  headingOffset: number
}

interface ElementNode {
  tag: string
  href?: string
  children: HtmlNode[]
}

type HtmlNode = ElementNode | string

/** Elements that never take a closing tag. */
const VOID_TAGS = new Set(['br', 'hr', 'img'])

/** Elements rendered as their own block rather than run into a paragraph. */
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'hr'])

/** The named entities that occur in the synced content, plus the XML five. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' ',
}

/**
 * Resolve a root-relative URL against the site origin.
 *
 * A ``/writing/...`` link read away from the site resolves against nothing, so
 * every internal cross-reference would otherwise be lost. Absolute and
 * protocol-relative URLs pass through untouched.
 *
 * @param url - A URL as it appears in the content.
 * @param baseUrl - Absolute origin, without a trailing slash.
 * @returns The URL, absolute if it was root-relative.
 */
export function absoluteUrl(url: string, baseUrl: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? `${baseUrl}${url}` : url
}

/**
 * Decode character references. Unknown named entities are left as written.
 *
 * @param text - Raw text from between tags.
 * @returns The decoded text.
 */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#')) {
      const hex = name[1] === 'x' || name[1] === 'X'
      return String.fromCodePoint(Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10))
    }
    return NAMED_ENTITIES[name.toLowerCase()] ?? entity
  })
}

/**
 * Parse an HTML fragment into a tree. Tolerant rather than strict: a stray
 * closing tag is ignored, and an unclosed element is closed by its parent's
 * closing tag or by the end of the input.
 *
 * @param html - The HTML fragment.
 * @returns The fragment's top-level nodes.
 */
function parse(html: string): HtmlNode[] {
  const root: ElementNode = { tag: '#root', children: [] }
  const stack: ElementNode[] = [root]

  for (const match of html.matchAll(/<(\/?)([a-z][a-z0-9]*)([^>]*)>|([^<]+)/gi)) {
    const [, closing, rawTag, attrs, text] = match
    const current = stack[stack.length - 1]!
    if (text !== undefined) {
      current.children.push(decodeEntities(text))
      continue
    }

    const tag = rawTag!.toLowerCase()
    if (closing) {
      const index = stack.findLastIndex(node => node.tag === tag)
      if (index > 0) stack.length = index
      continue
    }

    const href = /\bhref="([^"]*)"/i.exec(attrs!)?.[1]
    const node: ElementNode = { tag, children: [] }
    if (href !== undefined) node.href = decodeEntities(href)
    current.children.push(node)
    if (!VOID_TAGS.has(tag)) stack.push(node)
  }

  return root.children
}

/**
 * Render nodes as inline Markdown, collapsing whitespace the way a browser
 * would.
 *
 * @param nodes - Inline content.
 * @param options - Conversion options.
 * @returns Markdown, untrimmed.
 */
function renderInline(nodes: HtmlNode[], options: HtmlToMarkdownOptions): string {
  return nodes.map((node) => {
    if (typeof node === 'string') return node.replace(/\s+/g, ' ')

    const inner = renderInline(node.children, options)
    switch (node.tag) {
      case 'strong':
      case 'b':
        return `**${inner.trim()}**`
      case 'em':
      case 'i':
        return `*${inner.trim()}*`
      case 'code': {
        // A code span must be fenced by a longer backtick run than any it holds.
        const longest = Math.max(0, ...(inner.match(/`+/g) ?? []).map(run => run.length))
        const fence = '`'.repeat(longest + 1)
        return longest ? `${fence} ${inner} ${fence}` : `${fence}${inner}${fence}`
      }
      case 'a':
        return node.href ? `[${inner.trim()}](${absoluteUrl(node.href, options.baseUrl)})` : inner
      case 'br':
        return '\n'
      default:
        return inner
    }
  }).join('')
}

/**
 * Render one block-level element.
 *
 * @param node - A block element (one of ``BLOCK_TAGS``).
 * @param options - Conversion options.
 * @returns Markdown for the block, trimmed.
 */
function renderBlock(node: ElementNode, options: HtmlToMarkdownOptions): string {
  const heading = /^h([1-6])$/.exec(node.tag)
  if (heading) {
    const level = Math.min(Number(heading[1]) + options.headingOffset, 6)
    return `${'#'.repeat(level)} ${renderInline(node.children, options).trim()}`
  }

  switch (node.tag) {
    case 'ul':
    case 'ol': {
      const items = node.children.filter((child): child is ElementNode => typeof child !== 'string' && child.tag === 'li')
      return items.map((item, index) => {
        const marker = node.tag === 'ol' ? `${index + 1}.` : '-'
        return `${marker} ${renderInline(item.children, options).trim()}`
      }).join('\n')
    }
    case 'blockquote':
      return renderBlocks(node.children, options).split('\n').map(line => line ? `> ${line}` : '>').join('\n')
    case 'hr':
      return '***'
    default:
      return renderInline(node.children, options).trim()
  }
}

/**
 * Render a list of nodes as blocks separated by blank lines. Runs of inline
 * content between blocks become paragraphs of their own, which is how a bare
 * text description with no ``<p>`` comes out.
 *
 * @param nodes - Nodes at block level.
 * @param options - Conversion options.
 * @returns Markdown, trimmed.
 */
function renderBlocks(nodes: HtmlNode[], options: HtmlToMarkdownOptions): string {
  const blocks: string[] = []
  let run: HtmlNode[] = []
  const flush = () => {
    blocks.push(renderInline(run, options).trim())
    run = []
  }

  for (const node of nodes) {
    if (typeof node !== 'string' && BLOCK_TAGS.has(node.tag)) {
      flush()
      blocks.push(renderBlock(node, options))
    }
    else {
      run.push(node)
    }
  }
  flush()

  return blocks.filter(Boolean).join('\n\n')
}

/**
 * Convert an HTML fragment to Markdown.
 *
 * @param html - The fragment, as stored in a ``text_formatted`` paragraph.
 * @param options - Origin for root-relative links, and heading demotion.
 * @returns Markdown with blocks separated by blank lines, trimmed.
 */
export function htmlToMarkdown(html: string, options: HtmlToMarkdownOptions): string {
  return renderBlocks(parse(html), options)
}
