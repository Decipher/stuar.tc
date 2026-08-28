#!/usr/bin/env node
/**
 * Verify that the giscus comment threads still resolve for the articles that
 * have them.
 *
 * Giscus maps a page to a GitHub Discussion by its `pathname`, so the
 * discussion's *title* has to equal `writing/<slug>`. Nothing in the build
 * enforces that: if a slug changes, the URL scheme moves, or the category is
 * edited, the widget silently renders an empty "no comments yet" state instead
 * of erroring. That is how two real discussions sat orphaned under the site's
 * previous `articles/` and `blog/` path schemes, one of them holding an actual
 * reader's comment that nobody could see.
 *
 * This queries the same public resolver the widget calls on every page load, so
 * it needs no credentials and writes nothing.
 *
 * An article with no thread is not a failure. Giscus creates the discussion on
 * the first comment, so most articles legitimately have none. The failure this
 * guards against is a thread that used to resolve and no longer does, which is
 * why known threads are listed explicitly below.
 *
 * Usage: node scripts/verify-giscus.mjs [--json]
 */

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Mirrors the attributes set in app/components/AppGiscusComments.vue. If you
// change them there, change them here, and vice versa: the component's unit
// test pins the same values.
const REPO = 'Decipher/stuar.tc'
const CATEGORY = 'General'
const CATEGORY_ID = 'DIC_kwDOGZt9684CAB_7'

/**
 * Article slugs known to have a discussion thread, mapped to the discussion
 * number that slug must resolve to.
 *
 * The number is not decoration. Giscus matches titles loosely, so a term that
 * is merely a prefix of a real discussion title still resolves: asking for
 * `writing/hello` returns the `writing/hello-world-20211126` thread. Checking
 * only that *something* came back would therefore report a healthy mapping for
 * an article whose own thread does not exist, and would miss two articles
 * colliding onto one thread. Pinning the number makes the assertion an identity
 * check rather than a liveness check.
 *
 * Add a slug here once a thread exists for it; the script prints the exact line
 * to paste. Kept explicit rather than discovered from the GitHub API so the
 * check needs no token, and so removing a thread is a deliberate edit rather
 * than a silent pass.
 */
const EXPECTED_THREADS = {
  'hello-world-20211126': 2,
  'decoupling-configuration-config-pages-20220412': 82,
}

/** Abort a giscus request that has not answered in this long, in ms. */
const REQUEST_TIMEOUT_MS = 15000

const ARTICLES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'content',
  'articles-data',
)

/**
 * Ask giscus to resolve one term, retrying transient failures.
 *
 * A 404 is a definitive "no thread" and is returned as such. Network errors and
 * 5xx are retried, because this check talks to a third-party service and a blip
 * there should not read as a broken site.
 *
 * Mirrors the widget's own non-strict matching rather than forcing
 * `strict=true`, because the point is to observe what a reader's browser
 * actually resolves. The looseness that creates is handled by the caller, which
 * compares the returned discussion number against the expected one.
 *
 * @param {string} term - The pathname-derived discussion title.
 * @param {number} attempts - Remaining tries for transient failures.
 * @returns {Promise<{found: boolean, url?: string, number?: number, comments?: number}>} Result.
 */
async function resolveTerm(term, attempts = 3) {
  const qs = new URLSearchParams({
    repo: REPO,
    term,
    category: CATEGORY,
    categoryId: CATEGORY_ID,
    strict: 'false',
    last: '1',
  })
  try {
    // Without a signal a hung connection would stall the CI job indefinitely
    // rather than failing into the retry below.
    const res = await fetch(`https://giscus.app/api/discussions?${qs}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (res.status === 404) return { found: false }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.json()
    const url = body.discussion?.url
    return {
      found: Boolean(body.discussion),
      url,
      number: url ? Number(url.match(/\/discussions\/(\d+)$/)?.[1]) : undefined,
      comments: body.discussion?.totalCommentCount ?? 0,
    }
  }
  catch (err) {
    if (attempts <= 1) {
      throw new Error(`giscus lookup failed for "${term}": ${err.message}`, { cause: err })
    }
    await new Promise(r => setTimeout(r, 2000))
    return resolveTerm(term, attempts - 1)
  }
}

const files = (await readdir(ARTICLES_DIR)).filter(f => f.endsWith('.json'))
const articleSlugs = new Set(files.map(f => path.basename(f, '.json')))

// Check the union, not just the articles on disk. An expected thread whose
// article has been renamed away is exactly the orphaning this guards against,
// and iterating only over the directory would skip it silently.
const expectedSlugs = Object.keys(EXPECTED_THREADS)
const slugs = [...new Set([...articleSlugs, ...expectedSlugs])].sort()

const results = []
for (const slug of slugs) {
  const r = await resolveTerm(`writing/${slug}`)
  const expectedNumber = EXPECTED_THREADS[slug]
  results.push({
    slug,
    ...r,
    expected: expectedNumber !== undefined,
    expectedNumber,
    hasArticle: articleSlugs.has(slug),
  })
}

// A thread with no article is orphaned: readers can never reach it, which is
// the state this whole check exists because of.
const orphaned = results.filter(r => r.found && !r.hasArticle)

const missing = results.filter(r => r.expected && !r.found)

// Resolved, but to the wrong discussion. Giscus matches titles loosely, so this
// is how a renamed slug still "resolves" — to a neighbouring article's thread.
const mismatched = results.filter(r => r.expected && r.found && r.number !== r.expectedNumber)

// Two articles resolving to one discussion means readers of one see the other's
// comments. Loose matching makes this reachable whenever one slug is a prefix
// of another.
const byNumber = new Map()
for (const r of results.filter(x => x.found && x.hasArticle)) {
  byNumber.set(r.number, [...(byNumber.get(r.number) ?? []), r.slug])
}
const collisions = [...byNumber.entries()].filter(([, s]) => s.length > 1)

const undeclared = results.filter(r => !r.expected && r.found)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(
    { results, missing, mismatched, orphaned, undeclared, collisions },
    null,
    2,
  ))
}
else {
  console.log(`giscus mapping: ${REPO} (${CATEGORY}), term = "writing/<slug>"\n`)
  for (const r of results) {
    const mark = r.found ? '✓' : r.expected ? '✗' : '-'
    const detail = r.found
      ? `${r.comments} comment(s)  ${r.url}${r.hasArticle ? '' : '  [NO ARTICLE]'}`
      : r.hasArticle ? 'no thread yet' : 'no thread, no article'
    console.log(`  ${mark} writing/${r.slug}`.padEnd(66) + detail)
  }
}

// Everything below writes to stderr or is suppressed under --json, so that
// --json emits exactly one JSON document on stdout and stays pipeable to jq.
const json = process.argv.includes('--json')

if (undeclared.length && !json) {
  console.log(`\nNote: ${undeclared.length} thread(s) exist that are not in EXPECTED_THREADS.`)
  console.log('Add them to lock in the mapping:')
  for (const r of undeclared) console.log(`  '${r.slug}': ${r.number},`)
}

if (mismatched.length) {
  console.error(`\nFAIL: ${mismatched.length} thread(s) resolve to the wrong discussion:`)
  for (const r of mismatched) {
    console.error(`  writing/${r.slug}  expected #${r.expectedNumber}, got #${r.number}  ${r.url}`)
  }
  console.error('Giscus matches titles loosely, so a renamed or shortened slug can still')
  console.error('resolve, to a neighbouring article\'s thread. Readers would see the wrong')
  console.error('comments rather than none.')
}

if (collisions.length) {
  console.error(`\nFAIL: ${collisions.length} discussion(s) are claimed by more than one article:`)
  for (const [number, slugList] of collisions) {
    console.error(`  #${number} <- ${slugList.map(s => `writing/${s}`).join(', ')}`)
  }
  console.error('Readers of one article would see another article\'s comments.')
}

if (orphaned.length) {
  console.error(`\nFAIL: ${orphaned.length} thread(s) have no matching article:`)
  for (const r of orphaned) console.error(`  writing/${r.slug}  ${r.url}`)
  console.error('Readers cannot reach these. Rename the discussion to the current')
  console.error('article path, or drop the slug from EXPECTED_THREADS if it is retired.')
}

if (missing.length) {
  console.error(`\nFAIL: ${missing.length} expected thread(s) no longer resolve:`)
  for (const r of missing) {
    console.error(`  writing/${r.slug}`)
  }
  console.error('\nThe discussion title must equal the article pathname without a leading slash.')
  console.error('Either the slug changed, the discussion was renamed or deleted, or the')
  console.error('category in AppGiscusComments.vue no longer matches. Readers see an empty')
  console.error('comment box, not an error, so nothing else will report this.')
}

if (missing.length || orphaned.length || mismatched.length || collisions.length) process.exit(1)

if (!json) {
  console.log('\nAll expected threads resolve to their own discussion and map to a published article.')
}
