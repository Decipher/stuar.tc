import { describe, it, expect } from 'vitest'
import { absoluteUrl, htmlToMarkdown, linkDestination } from '../../server/utils/htmlToMarkdown'

const md = (html: string, headingOffset = 0) => htmlToMarkdown(html, { baseUrl: 'https://example.test', headingOffset })

describe('absoluteUrl', () => {
  it('resolves root-relative URLs against the origin', () => {
    expect(absoluteUrl('/writing/post', 'https://example.test')).toBe('https://example.test/writing/post')
  })

  it('leaves absolute and protocol-relative URLs alone', () => {
    expect(absoluteUrl('https://drupal.org/', 'https://example.test')).toBe('https://drupal.org/')
    expect(absoluteUrl('//cdn.test/x.png', 'https://example.test')).toBe('//cdn.test/x.png')
  })
})

describe('linkDestination', () => {
  it('percent-encodes the characters that would end a Markdown destination early', () => {
    expect(linkDestination('https://example.test/a b/(c).pdf')).toBe('https://example.test/a%20b/%28c%29.pdf')
    expect(linkDestination('https://example.test/plain')).toBe('https://example.test/plain')
  })
})

describe('htmlToMarkdown', () => {
  it('separates paragraphs with a blank line and collapses whitespace inside them', () => {
    expect(md('<p>One\n  two</p>\n\n<p>Three</p>')).toBe('One two\n\nThree')
  })

  it('renders inline emphasis, code and links', () => {
    expect(md('<p><strong>a</strong> <b>b</b> <em>c</em> <i>d</i> <code>e</code></p>')).toBe('**a** **b** *c* *d* `e`')
  })

  it('fences a code span containing backticks with a longer run', () => {
    expect(md('<p><code>a`b</code></p>')).toBe('`` a`b ``')
  })

  it('makes root-relative links absolute and keeps absolute ones', () => {
    expect(md('<p><a href="/writing/x">here</a> and <a href="https://drupal.org">there</a></p>'))
      .toBe('[here](https://example.test/writing/x) and [there](https://drupal.org)')
  })

  it('keeps the text of a link with no href', () => {
    expect(md('<p><a name="anchor">text</a></p>')).toBe('text')
  })

  it('decodes named, decimal and hex character references, and drops carriage returns', () => {
    expect(md('<p>a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;&nbsp;f&#13;</p>')).toBe('a & b <c> "d" \'e\' f')
    expect(md('<p>&#65;&#x42;&#X43;</p>')).toBe('ABC')
  })

  it('leaves an unknown named entity as written', () => {
    expect(md('<p>&bogus;</p>')).toBe('&bogus;')
  })

  it('decodes entities in an href', () => {
    expect(md('<a href="/q?a=1&amp;b=2">q</a>')).toBe('[q](https://example.test/q?a=1&b=2)')
  })

  it('demotes headings by the offset, capped at H6', () => {
    expect(md('<h2>Two</h2><h6>Six</h6>', 1)).toBe('### Two\n\n###### Six')
    expect(md('<h3>Three</h3>')).toBe('### Three')
  })

  it('renders unordered and ordered lists, ignoring anything between items', () => {
    expect(md('<ul>\n<li>one</li>\n<li>two</li>\n</ul>')).toBe('- one\n- two')
    expect(md('<ol><li>one</li><span>x</span><li>two</li></ol>')).toBe('1. one\n2. two')
  })

  it('keeps a nested list inside its parent item', () => {
    expect(md('<ul><li>Parent<ul><li>First</li><li>Second</li></ul></li><li>Next</li></ul>'))
      .toBe('- Parent\n\n  - First\n  - Second\n- Next')
    expect(md('<ol><li><p>One</p><ol><li>Sub</li></ol></li></ol>')).toBe('1. One\n\n   1. Sub')
  })

  it('encodes parentheses and spaces in link destinations', () => {
    expect(md('<a href="/files/a)b c.pdf">file</a>')).toBe('[file](https://example.test/files/a%29b%20c.pdf)')
  })

  it('prefixes every line of a blockquote, including the blank ones', () => {
    expect(md('<blockquote><p>one</p><p>two</p></blockquote>')).toBe('> one\n>\n> two')
  })

  it('renders a horizontal rule and a line break', () => {
    expect(md('<p>a<br>b</p><hr>')).toBe('a\nb\n\n***')
  })

  it('turns bare text and inline runs between blocks into paragraphs', () => {
    expect(md('Just text, no markup.')).toBe('Just text, no markup.')
    expect(md('before <em>x</em><p>para</p>after')).toBe('before *x*\n\npara\n\nafter')
  })

  it('renders the text of unknown elements', () => {
    expect(md('<p><span>inside</span></p>')).toBe('inside')
  })

  it('tolerates a stray closing tag, and closes unclosed elements at their parent or the end', () => {
    expect(md('<p>a</em>b</p>')).toBe('ab')
    expect(md('<p><strong>bold</p><p>next')).toBe('**bold**\n\nnext')
  })

  it('returns an empty string for empty input', () => {
    expect(md('')).toBe('')
  })
})
