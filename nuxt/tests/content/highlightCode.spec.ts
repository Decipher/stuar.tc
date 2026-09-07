import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PLAIN_LANGUAGE,
  SUPPORTED_LANGUAGES,
  highlightCode,
} from '../../lib/highlightCode.mjs'

describe('highlightCode', () => {
  it('emits Prism token markup for a supported language', () => {
    const html = highlightCode('const a = 1', 'js')
    expect(html).toContain('class="token keyword"')
    expect(html).toContain('class="token number"')
  })

  it('resolves aliases to their grammar', () => {
    expect(highlightCode('const a = 1', 'javascript'))
      .toBe(highlightCode('const a = 1', 'js'))
  })

  it('loads grammars outside Prism core', () => {
    expect(highlightCode('key: value', 'yaml')).toContain('token')
    expect(highlightCode('echo hi', 'sh')).toContain('token')
  })

  it('escapes markup so code cannot inject HTML', () => {
    const html = highlightCode('const a = "<img src=x onerror=1>"', 'js')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  // A null return is the component's signal to render the raw string, so
  // these are the cases that must never throw or silently emit markup.
  it.each([
    ['no language', undefined],
    ['the plain language', PLAIN_LANGUAGE],
    ['an unknown language', 'brainfuck'],
  ])('returns null for %s', async (_label, language) => {
    expect(highlightCode('const a = 1', language)).toBeNull()
  })

  it('is deterministic, so visual snapshots stay stable', () => {
    expect(highlightCode('const a = 1', 'js'))
      .toBe(highlightCode('const a = 1', 'js'))
  })

  it('lists every alias and grammar as supported, including text', () => {
    expect(SUPPORTED_LANGUAGES).toContain(PLAIN_LANGUAGE)
    expect(SUPPORTED_LANGUAGES).toEqual([...SUPPORTED_LANGUAGES].sort())
    expect(new Set(SUPPORTED_LANGUAGES).size).toBe(SUPPORTED_LANGUAGES.length)
  })
})

describe('grammar registration', () => {
  // prism-php depends on markup-templating being registered first; importing
  // them the other way round throws only when php is actually tokenised, so
  // this is the test that would catch a reordered import.
  it('tokenises every declared grammar without throwing', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      if (language === PLAIN_LANGUAGE) continue
      expect(() => highlightCode('x', language), language).not.toThrow()
      expect(highlightCode('x', language), language).not.toBeNull()
    }
  })
})

describe('committed articles', () => {
  // The markup is derived data checked into generated content files. This is
  // what stops it drifting: edit a code block without re-running
  // scripts/highlight-code.mjs and the article no longer matches.
  it('carries highlighting that matches its code and language', () => {
    const dir = join(__dirname, '../../content/articles-data')
    const files = readdirSync(dir).filter(name => name.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)

    const blocks: { file: string, title?: string, stored: unknown, expected: string | null }[] = []
    const walk = (file: string, node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(child => walk(file, child))
      if (!node || typeof node !== 'object') return
      const record = node as Record<string, unknown>
      if (record.type === 'code') {
        blocks.push({
          file,
          title: record.title as string | undefined,
          stored: record.highlighted ?? null,
          expected: highlightCode(record.code as string, record.language as string | undefined),
        })
      }
      Object.values(record).forEach(value => walk(file, value))
    }

    for (const file of files) {
      walk(file, JSON.parse(readFileSync(join(dir, file), 'utf8')))
    }

    expect(blocks.length).toBeGreaterThan(0)
    for (const block of blocks) {
      expect(block.stored, `${block.file} :: ${block.title}`).toEqual(block.expected)
    }
  })
})
