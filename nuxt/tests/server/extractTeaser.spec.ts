import { describe, it, expect } from 'vitest'
import { extractTeaser } from '../../server/utils/extractTeaser'

const URL = 'https://stuar.tc/writing/test-20240101'
const FALLBACK = 'A short summary of the article.'

/** Helper: build a ``text_formatted`` paragraph. */
function text(html: string) {
  return { type: 'text_formatted', html }
}

/** Helper: build a ``section`` paragraph with a single ``content`` region. */
function section(children: unknown[]) {
  return { type: 'section', layout: 'layout_onecol', regions: { content: children } }
}

describe('extractTeaser', () => {
  it('includes a single text_formatted block and appends a read-more link', () => {
    const result = extractTeaser(
      [text('<p>Hello world.</p>')],
      URL,
      FALLBACK,
    )
    expect(result).toContain('<p>Hello world.</p>')
    expect(result).toContain(`<a href="${URL}">Continue reading →</a>`)
  })

  it('accumulates blocks up to ~600 characters of visible text', () => {
    const shortBlock = text(`<p>${'a'.repeat(200)}</p>`)
    const result = extractTeaser([shortBlock, shortBlock, shortBlock, shortBlock], URL, FALLBACK)
    // 200 + 200 + 200 = 600 → three blocks should be included, fourth dropped.
    const blockCount = (result.match(/<p>a{200}<\/p>/g) || []).length
    expect(blockCount).toBe(3)
    expect(result).toContain('Continue reading →')
  })

  it('stops as soon as the 600-char threshold is reached', () => {
    // A single block well over the limit — should be included alone.
    const longBlock = text(`<p>${'x'.repeat(800)}</p>`)
    const result = extractTeaser([longBlock, text('<p>should not appear</p>')], URL, FALLBACK)
    expect(result).toContain('x'.repeat(800))
    expect(result).not.toContain('should not appear')
  })

  it('recurses into section regions', () => {
    const result = extractTeaser(
      [section([text('<p>Inside section.</p>')])],
      URL,
      FALLBACK,
    )
    expect(result).toContain('<p>Inside section.</p>')
  })

  it('recurses into jumbotron content', () => {
    const result = extractTeaser(
      [{ type: 'jumbotron', content: [text('<p>Jumbotron text.</p>')] }],
      URL,
      FALLBACK,
    )
    expect(result).toContain('<p>Jumbotron text.</p>')
  })

  it('recurses into card_group cards', () => {
    const result = extractTeaser(
      [{ type: 'card_group', cards: [text('<p>Card text.</p>')] }],
      URL,
      FALLBACK,
    )
    expect(result).toContain('<p>Card text.</p>')
  })

  it('skips non-prose paragraph types (code, media, repository)', () => {
    const result = extractTeaser(
      [
        { type: 'code', code: 'console.log("hi")' },
        { type: 'media', url: 'https://example.com/img.png' },
        { type: 'repository', url: 'https://github.com/foo/bar' },
      ],
      URL,
      FALLBACK,
    )
    // No prose → falls back to description.
    expect(result).toContain(FALLBACK)
    expect(result).not.toContain('console.log')
    expect(result).toContain('Continue reading →')
  })

  it('falls back to the description when no text_formatted blocks exist', () => {
    const result = extractTeaser([], URL, FALLBACK)
    expect(result).toContain(`<p>${FALLBACK}</p>`)
    expect(result).toContain('Continue reading →')
  })

  it('strips Drupal &#13; carriage-return entities from collected HTML', () => {
    const result = extractTeaser(
      [text('<p>Hello&#13;\nWorld</p>')],
      URL,
      FALLBACK,
    )
    expect(result).not.toContain('&#13;')
    expect(result).toContain('<p>Hello\nWorld</p>')
  })

  it('uses the provided article URL in the read-more link', () => {
    const customUrl = 'https://example.com/custom/path'
    const result = extractTeaser([text('<p>Text.</p>')], customUrl, FALLBACK)
    expect(result).toContain(`href="${customUrl}"`)
  })

  it('preserves HTML formatting (headings, blockquotes, strong, etc.)', () => {
    const html = '<h2>Title</h2>\n\n<p>Text with <strong>bold</strong> and <a href="https://drupal.org">link</a>.</p>'
    const result = extractTeaser([text(html)], URL, FALLBACK)
    expect(result).toContain('<h2>Title</h2>')
    expect(result).toContain('<strong>bold</strong>')
  })
})
