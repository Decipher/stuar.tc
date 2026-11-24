import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { ISOLATION_HEADERS, hasStackblitz, isolatedRouteRules } from '../../lib/isolatedRoutes.mjs'

/**
 * Write article JSON files into a fresh temporary directory.
 *
 * @param articles - Each file's name and contents.
 * @returns The directory.
 */
function articlesDir(articles: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'isolated-routes-'))
  for (const [name, article] of Object.entries(articles)) writeFileSync(join(dir, name), JSON.stringify(article))
  return dir
}

const stackblitz = { type: 'stackblitz', title: 'Demo', url: 'https://stackblitz.com/github/x/y' }

describe('hasStackblitz', () => {
  it('finds a StackBlitz paragraph nested in a section region', () => {
    expect(hasStackblitz([{ type: 'section', regions: { content: [{ type: 'text_formatted', html: '' }, stackblitz] } }])).toBe(true)
  })

  it('is false for an article without one', () => {
    expect(hasStackblitz([{ type: 'section', regions: { content: [{ type: 'text_formatted', html: '' }] } }])).toBe(false)
    expect(hasStackblitz(undefined)).toBe(false)
  })
})

describe('isolatedRouteRules', () => {
  it('isolates only the articles that embed StackBlitz', () => {
    const dir = articlesDir({
      'a.json': { path: '/writing/a', paragraphs: [{ type: 'section', regions: { content: [stackblitz] } }] },
      'b.json': { path: '/writing/b', paragraphs: [{ type: 'text_formatted', html: '<p>b</p>' }] },
      'notes.txt': 'not an article',
      'c.json': { paragraphs: [stackblitz] },
    })
    expect(isolatedRouteRules(dir)).toEqual({ '/writing/a': { headers: { ...ISOLATION_HEADERS } } })
  })

  it('sends COOP same-origin and COEP credentialless', () => {
    expect(ISOLATION_HEADERS).toEqual({
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'credentialless',
    })
  })

  it('isolates the Druxt 0.25.2 post, the one article with an embed today', () => {
    expect(Object.keys(isolatedRouteRules(join(__dirname, '../../content/articles-data'))))
      .toEqual(['/writing/druxt-0252-drupal-canvas-sites-no-drupal-required-20261124'])
  })
})
