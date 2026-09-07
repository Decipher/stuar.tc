#!/usr/bin/env node
/**
 * Write Prism's token markup into every `code` paragraph in articles-data.
 *
 * The articles are generated files — sync-content.mjs writes them from
 * Drupal — so a derived field belongs in them the same way the rest of the
 * synced content does. Storing it is what keeps Prism out of the browser: see
 * lib/highlightCode.mjs for the two places this was tried first and why
 * neither worked.
 *
 * Idempotent, and safe to run over an article whose code has changed: the
 * field is recomputed from `code` and `language` every time rather than
 * filled in only when missing. tests/content/highlightCode.spec.ts asserts
 * the committed files match what this produces, so a forgotten run fails CI
 * rather than publishing a stale block.
 *
 * Usage: node scripts/highlight-code.mjs [--check]
 *   --check  report drift and exit non-zero without writing.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { highlightCode } from '../lib/highlightCode.mjs'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/articles-data')

/**
 * Recompute `highlighted` on every code paragraph, returning how many changed.
 *
 * Walks regions and nested paragraph lists, since a code block can sit inside
 * a section or a jumbotron rather than at the top level.
 *
 * @param {unknown} node
 * @returns {number}
 */
function rewrite(node) {
  if (Array.isArray(node)) return node.reduce((n, child) => n + rewrite(child), 0)
  if (!node || typeof node !== 'object') return 0

  let changed = 0
  if (node.type === 'code') {
    const highlighted = highlightCode(node.code, node.language)
    if ((node.highlighted ?? null) !== highlighted) changed++
    // Removed rather than set to null when there is nothing to store, so a
    // block downgraded to `text` loses its old markup and an article of
    // unhighlighted blocks keeps a clean diff.
    if (highlighted === null) delete node.highlighted
    else node.highlighted = highlighted
  }
  for (const value of Object.values(node)) changed += rewrite(value)
  return changed
}

const check = process.argv.includes('--check')
const files = (await readdir(dir)).filter(name => name.endsWith('.json')).sort()
const stale = []

for (const name of files) {
  const file = path.join(dir, name)
  const article = JSON.parse(await readFile(file, 'utf8'))
  if (!rewrite(article)) continue

  stale.push(name)
  if (!check) await writeFile(file, JSON.stringify(article, null, 2) + '\n')
}

if (!stale.length) {
  console.log(`${files.length} articles, all highlighting up to date.`)
}
else if (check) {
  console.error(`Highlighting is stale in ${stale.length} of ${files.length} articles:`)
  for (const name of stale) console.error(`  ${name}`)
  console.error('\nRun: node scripts/highlight-code.mjs')
  process.exit(1)
}
else {
  console.log(`Updated highlighting in ${stale.length} of ${files.length} articles:`)
  for (const name of stale) console.log(`  ${name}`)
}
