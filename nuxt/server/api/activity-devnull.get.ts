import { defineEventHandler } from 'h3'
import { setHeartbeatCacheHeaders } from '../utils/heartbeatCache'
import { timeoutSignal } from '../utils/timeoutSignal'

/**
 * Stuart's /dev/null posts ("commits"), read from the public Atom feed.
 *
 * /dev/null has no API, ActivityPub or WebFinger, and the feed sends no CORS
 * header, so the browser can't read it: this route fetches it server-side
 * and trims each entry to what the Heartbeat renders. Any failure (network,
 * timeout, non-2xx, unparseable body) yields `[]`, so the other Heartbeat
 * sources still show.
 */

export const DEVNULL_FEED_URL = 'https://dev-null.sh/@Decipher/feed.atom'

const FETCH_TIMEOUT_MS = 5000

// dev-null.sh sits behind Cloudflare, which is likelier to challenge a
// request from a cloud IP with no or a generic User-Agent. Say who we are.
const USER_AGENT = 'stuar.tc heartbeat (+https://stuar.tc)'

/** One /dev/null post, trimmed for the Heartbeat. */
export interface DevNullPost {
  /** The entry's Atom id (a urn:uuid). */
  id: string
  /** ISO 8601 publish time. */
  published: string
  /** Permalink to the post on dev-null.sh. */
  url: string
  /** The post's first paragraph, URLs removed. */
  text: string
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' ',
}

/**
 * Decodes XML character and entity references (`&amp;`, `&#39;`, `&#x2019;`).
 * Unknown named entities are left as they are.
 *
 * @param s - Raw XML text content.
 * @returns The decoded string.
 */
export function decodeXmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X'
        ? Number.parseInt(ref.slice(2), 16)
        : Number.parseInt(ref.slice(1), 10)
      try {
        return String.fromCodePoint(code)
      }
      catch {
        return match
      }
    }
    return NAMED_ENTITIES[ref.toLowerCase()] ?? match
  })
}

/**
 * Reduces a post body to the line the Heartbeat shows: its first paragraph
 * with URLs removed and whitespace collapsed. A paragraph that was only a
 * URL is skipped in favour of the next one.
 *
 * @param body - The decoded post body (plain text, paragraphs separated by blank lines).
 * @returns The first non-empty paragraph, or `''`.
 */
export function firstParagraph(body: string): string {
  for (const para of body.split(/\r?\n\s*\r?\n/)) {
    const text = para.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
    if (text) return text
  }
  return ''
}

/**
 * Returns the text content of the first `<tag>` element in `xml`, with any
 * CDATA wrapper removed but entities still encoded.
 *
 * @param xml - An XML fragment.
 * @param tag - Element name to find.
 * @returns The element's attribute string and inner text, or `undefined` if absent.
 */
function elementText(xml: string, tag: string): { attrs: string; text: string } | undefined {
  const m = xml.match(new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))
  if (!m) return undefined
  const cdata = m[2]!.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
  return { attrs: m[1] ?? '', text: cdata ? cdata[1]! : m[2]! }
}

/**
 * Parses an Atom feed into trimmed /dev/null posts. A regex parse of
 * `<entry>` blocks, enough for /dev/null's flat feed without adding an XML
 * dependency. Entries missing an id, publish date or link are skipped.
 *
 * @param xml - The feed document.
 * @returns The posts in feed order (newest first on /dev/null).
 */
export function parseDevNullFeed(xml: string): DevNullPost[] {
  const posts: DevNullPost[] = []
  for (const [, entry] of xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)) {
    const id = elementText(entry!, 'id')?.text.trim()
    const published = elementText(entry!, 'published')?.text.trim() ?? elementText(entry!, 'updated')?.text.trim()
    const link = entry!.match(/<link\b(?=[^>]*\brel="alternate")[^>]*\bhref="([^"]+)"/)
      ?? entry!.match(/<link\b[^>]*\bhref="([^"]+)"/)
    if (!id || !published || !link || Number.isNaN(Date.parse(published))) continue

    // /dev/null sends plain text. Markup content (type="html"/"xhtml") is not
    // parsed: stripping tags with a regex is never a complete sanitiser, so
    // such an entry falls back to its title.
    const content = elementText(entry!, 'content')
    const body = content && !/\btype="x?html"/.test(content.attrs) ? decodeXmlEntities(content.text) : ''
    const text = firstParagraph(body) || decodeXmlEntities(elementText(entry!, 'title')?.text ?? '').trim()

    posts.push({
      id: decodeXmlEntities(id),
      published: new Date(published).toISOString(),
      url: decodeXmlEntities(link[1]!),
      text,
    })
  }
  return posts
}

/**
 * Fetches and parses the /dev/null feed. Never throws.
 *
 * @param url - Feed URL (defaults to Stuart's).
 * @returns The posts, or `[]` on any failure.
 */
export async function fetchDevNullPosts(url: string = DEVNULL_FEED_URL): Promise<DevNullPost[]> {
  const { signal, clear } = timeoutSignal(FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/atom+xml', 'User-Agent': USER_AGENT },
      signal,
    })
    if (!res.ok) {
      console.warn(`[heartbeat] /dev/null feed returned ${res.status}`)
      return []
    }
    return parseDevNullFeed(await res.text())
  }
  catch (error) {
    console.warn(`[heartbeat] /dev/null feed failed: ${error instanceof Error ? error.name : String(error)}`)
    return []
  }
  finally {
    clear()
  }
}

export default defineEventHandler((event) => {
  setHeartbeatCacheHeaders(event)
  return fetchDevNullPosts()
})
