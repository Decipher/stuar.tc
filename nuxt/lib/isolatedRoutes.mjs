/**
 * Route rules that make a page cross-origin isolated, for every article that
 * embeds a StackBlitz project.
 *
 * A StackBlitz embed of a Node project runs WebContainers, which need
 * SharedArrayBuffer, and a browser only allows that in a cross-origin
 * isolated page. Without these headers StackBlitz answers "Unable to run
 * Embedded Project". Isolation changes how a page may load cross-origin
 * content, so it is applied only to the pages that need it, never site-wide.
 *
 * `credentialless` rather than `require-corp`: it isolates the page while
 * still loading cross-origin scripts and images that send no
 * Cross-Origin-Resource-Policy header, such as analytics, just without
 * cookies.
 *
 * @module lib/isolatedRoutes
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The headers a page needs to be cross-origin isolated. */
export const ISOLATION_HEADERS = Object.freeze({
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'credentialless',
})

/**
 * Whether a paragraph tree contains a StackBlitz paragraph, at any depth.
 *
 * @param {unknown} node - A paragraph, an array of paragraphs, or a section's regions.
 * @returns {boolean} True when a `stackblitz` paragraph is found.
 */
export function hasStackblitz(node) {
  if (Array.isArray(node)) return node.some(hasStackblitz)
  if (!node || typeof node !== 'object') return false
  if (node.type === 'stackblitz') return true
  return Object.values(node).some(value => typeof value === 'object' && hasStackblitz(value))
}

/**
 * Route rules for every article in a directory of article JSON that embeds
 * StackBlitz.
 *
 * @param {string} dir - The articles-data directory.
 * @returns {Record<string, { headers: Record<string, string> }>} Route rules keyed by article path.
 */
export function isolatedRouteRules(dir) {
  const rules = {}
  for (const file of readdirSync(dir).filter(name => name.endsWith('.json')).sort()) {
    const article = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    if (article.path && hasStackblitz(article.paragraphs)) {
      rules[article.path] = { headers: { ...ISOLATION_HEADERS } }
    }
  }
  return rules
}
