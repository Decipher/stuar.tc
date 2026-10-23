import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import {
  DEVNULL_FEED_URL,
  decodeXmlEntities,
  fetchDevNullPosts,
  firstParagraph,
  parseDevNullFeed,
} from '../../server/api/activity-devnull.get'

// A copy of https://dev-null.sh/@Decipher/feed.atom as served on 2026-10-23.
const FEED = readFileSync(join(import.meta.dirname, 'fixtures/devnull-feed.atom'), 'utf8')

function makeEvent() {
  const req = new IncomingMessage(null as never)
  req.url = '/'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

function entry(inner: string) {
  return `<feed xmlns="http://www.w3.org/2005/Atom"><entry>${inner}</entry></feed>`
}

describe('decodeXmlEntities', () => {
  it('decodes named, decimal and hex references', () => {
    expect(decodeXmlEntities('a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos; &#39;f&#x2019; &#X41;'))
      .toBe('a & b <c> "d" \'e\' \'f’ A')
  })

  it('leaves unknown entities and out-of-range code points alone', () => {
    expect(decodeXmlEntities('&bogus; &#x110000;')).toBe('&bogus; &#x110000;')
  })
})

describe('firstParagraph', () => {
  it('returns the first paragraph with whitespace collapsed', () => {
    expect(firstParagraph('Hello\n  world.\n\nSecond.')).toBe('Hello world.')
  })

  it('strips URLs and skips a paragraph that was only a URL', () => {
    expect(firstParagraph('https://stuar.tc/x\n\nRead https://a.b/c this.')).toBe('Read this.')
  })

  it('returns empty for an empty body', () => {
    expect(firstParagraph('  \n\n ')).toBe('')
  })
})

describe('parseDevNullFeed', () => {
  it('parses the saved feed into trimmed posts', () => {
    expect(parseDevNullFeed(FEED)).toEqual([
      {
        id: 'urn:uuid:01a16a19-0574-72bb-a22e-97ee5553b401',
        published: '2026-10-23T18:49:47.000Z',
        url: 'https://dev-null.sh/@Decipher/commits/01a16a19-0574-72bb-a22e-97ee5553b401',
        text: 'Druxt 0.25.0 is out, the first release of my Fully Decoupled Drupal framework for Nuxt since 2023.',
      },
      {
        id: 'urn:uuid:01a16a18-05f5-71e8-b3be-28497f50aa0e',
        published: '2026-10-23T18:48:41.000Z',
        url: 'https://dev-null.sh/@Decipher/commits/01a16a18-05f5-71e8-b3be-28497f50aa0e',
        text: 'Hello world.',
      },
    ])
  })

  it('returns [] for something that is not a feed', () => {
    expect(parseDevNullFeed('<html><body>Cloudflare says no</body></html>')).toEqual([])
    expect(parseDevNullFeed('')).toEqual([])
  })

  it('skips entries without an id, a valid date or a link', () => {
    const xml = [
      '<entry><published>2026-10-23T00:00:00Z</published><link href="https://x/1"/></entry>',
      '<entry><id>a</id><link href="https://x/2"/></entry>',
      '<entry><id>b</id><published>not a date</published><link href="https://x/3"/></entry>',
      '<entry><id>c</id><published>2026-10-23T00:00:00Z</published></entry>',
    ].join('')
    expect(parseDevNullFeed(xml)).toEqual([])
  })

  it('falls back to updated, a non-alternate link, and the title', () => {
    const xml = entry(
      '<id>x</id><updated>2026-10-23T01:00:00+00:00</updated>'
      + '<link rel="self" href="https://dev-null.sh/a?x=1&amp;y=2"/>'
      + '<title>Only &amp; title</title>',
    )
    expect(parseDevNullFeed(xml)).toEqual([
      { id: 'x', published: '2026-10-23T01:00:00.000Z', url: 'https://dev-null.sh/a?x=1&y=2', text: 'Only & title' },
    ])
  })

  it('returns empty text when there is no content or title', () => {
    const xml = entry('<id>x</id><published>2026-10-23T01:00:00Z</published><link href="https://x"/>')
    expect(parseDevNullFeed(xml)[0]!.text).toBe('')
  })

  it('decodes entities in text content and unwraps CDATA', () => {
    const xml = entry(
      '<id>x</id><published>2026-10-23T01:00:00Z</published><link rel="alternate" href="https://x"/>'
      + '<content type="text"><![CDATA[Tom & Jerry\'s <b>post</b>]]></content>',
    )
    expect(parseDevNullFeed(xml)[0]!.text).toBe('Tom & Jerry\'s <b>post</b>')
    const encoded = entry(
      '<id>x</id><published>2026-10-23T01:00:00Z</published><link rel="alternate" href="https://x"/>'
      + '<content>It&#39;s &lt;fine&gt;</content>',
    )
    expect(parseDevNullFeed(encoded)[0]!.text).toBe('It\'s <fine>')
  })

  it('strips markup from html content', () => {
    const xml = entry(
      '<id>x</id><published>2026-10-23T01:00:00Z</published><link rel="alternate" href="https://x"/>'
      + '<content type="html">&lt;p&gt;First &amp;amp; &lt;a href="https://y"&gt;link&lt;/a&gt;&lt;/p&gt;&lt;p&gt;Second&lt;/p&gt;</content>',
    )
    expect(parseDevNullFeed(xml)[0]!.text).toBe('First & link')
  })
})

describe('fetchDevNullPosts', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('fetches the feed with a timeout and parses it', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve(FEED) } as Response)
    const posts = await fetchDevNullPosts()
    expect(posts).toHaveLength(2)
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(DEVNULL_FEED_URL)
    expect(vi.mocked(fetch).mock.calls[0]![1]!.signal).toBeInstanceOf(AbortSignal)
  })

  it('identifies itself and asks for Atom (dev-null.sh is behind Cloudflare)', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve(FEED) } as Response)
    await fetchDevNullPosts()
    const headers = vi.mocked(fetch).mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers['User-Agent']).toBe('stuar.tc heartbeat (+https://stuar.tc)')
    expect(headers.Accept).toBe('application/atom+xml')
  })

  it('returns [] for a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 503 } as Response)
    expect(await fetchDevNullPosts()).toEqual([])
  })

  it('returns [] when the request fails or times out', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('timed out', 'TimeoutError'))
    expect(await fetchDevNullPosts()).toEqual([])
  })

  it('returns [] when the body is unparseable', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve('not xml') } as Response)
    expect(await fetchDevNullPosts()).toEqual([])
  })
})

describe('handler', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns the parsed posts', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: () => Promise.resolve(FEED) } as Response)
    const { default: handler } = await import('../../server/api/activity-devnull.get')
    const event = makeEvent()
    const result = await handler(event)
    expect(event.node.res.getHeader('cache-control')).toBe('public, max-age=60')
    expect(event.node.res.getHeader('netlify-cdn-cache-control')).toBe('public, s-maxage=300, stale-while-revalidate=600')
    expect(result.map(p => p.text)).toEqual([
      'Druxt 0.25.0 is out, the first release of my Fully Decoupled Drupal framework for Nuxt since 2023.',
      'Hello world.',
    ])
  })
})
