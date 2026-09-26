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

  it('skips null/undefined nodes encountered while walking a region', () => {
    const result = extractTeaser(
      [section([null, text('<p>Inside section.</p>'), undefined])],
      URL,
      FALLBACK,
    )
    expect(result).toContain('<p>Inside section.</p>')
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

describe('extractTeaser lead image', () => {
  const media = (src: string, alt = 'Alt text') => ({ type: 'media', src, alt })

  it('emits no image when no origin is given, so existing callers are unchanged', () => {
    const result = extractTeaser([media('/images/a.png'), text('<p>Prose.</p>')], URL, FALLBACK)
    expect(result).not.toContain('<img')
  })

  it('puts the first media first, absolute, so a feed reader can resolve it', () => {
    const result = extractTeaser(
      [text('<p>Prose.</p>'), media('/images/a.png')],
      URL, FALLBACK, 'https://stuar.tc',
    )
    expect(result.indexOf('<img')).toBeLessThan(result.indexOf('<p>Prose.</p>'))
    expect(result).toContain('src="https://stuar.tc/images/a.png"')
    expect(result).toContain('alt="Alt text"')
  })

  it('carries only the first image', () => {
    const result = extractTeaser(
      [media('/images/a.png'), media('/images/b.png')],
      URL, FALLBACK, 'https://stuar.tc',
    )
    expect((result.match(/<img/g) || []).length).toBe(1)
    expect(result).not.toContain('b.png')
  })

  it('finds media nested in a section region', () => {
    const result = extractTeaser(
      [section([media('/images/nested.png')])],
      URL, FALLBACK, 'https://stuar.tc',
    )
    expect(result).toContain('nested.png')
  })

  it('leaves an already-absolute src alone', () => {
    const result = extractTeaser([media('https://cdn.example/a.png')], URL, FALLBACK, 'https://stuar.tc')
    expect(result).toContain('src="https://cdn.example/a.png"')
  })

  it('escapes quotes in alt text rather than breaking the attribute', () => {
    const result = extractTeaser([media('/a.png', 'He said "hi" & left')], URL, FALLBACK, 'https://stuar.tc')
    expect(result).toContain('alt="He said &quot;hi&quot; &amp; left"')
  })

  it('does not spend the 600-character prose budget on the image', () => {
    const block = text(`<p>${'a'.repeat(200)}</p>`)
    const withImage = extractTeaser([media('/a.png'), block, block, block, block], URL, FALLBACK, 'https://stuar.tc')
    expect((withImage.match(/<p>a{200}<\/p>/g) || []).length).toBe(3)
  })

  it('still emits the image when the article has no prose at all', () => {
    const result = extractTeaser([media('/a.png')], URL, FALLBACK, 'https://stuar.tc')
    expect(result).toContain('<img')
    expect(result).toContain(FALLBACK)
  })
})
