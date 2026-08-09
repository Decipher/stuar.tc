/**
 * Per-metric Lighthouse budget validator.
 *
 * Reads the unlighthouse report (ci-result.json + per-page lighthouse.json)
 * and fails if any page breaches the thresholds below.  Runs after
 * unlighthouse-ci in the audit:seo CI job.
 *
 * Thresholds are set at the Lighthouse "needs improvement / poor" boundary
 * — they prevent regressions without gating on aspirational targets the
 * current static SSG cannot yet meet (e.g. FCP < 1.8 s).
 *
 * Usage:  node scripts/audit-budgets.mjs [.unlighthouse-dir] [--markdown <path>]
 *
 * @module audit-budgets
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** @typedef {{ numericValue: number, displayValue: string, score: number | null }} Audit */

/** @typedef {{ path: string, fcp: number, lcp: number, cls: number, tbt: number, perf: number }} PageMetrics */

/**
 * Per-metric thresholds.  A page fails if ANY metric exceeds its ceiling.
 *
 * Set at the Lighthouse "poor" boundary for each metric — the goal is to
 * prevent regressions into poor territory, not to gate on aspirational
 * targets.  Tighten these as performance improves.
 */
const THRESHOLDS = Object.freeze({
  fcp: 3_500,   // ms  — 500 ms headroom above the 3 000 ms "poor" line
  lcp: 5_000,   // ms  — CI runners are ~2× slower than local; 4 000 ms "poor" line + headroom
  cls: 0.25,    // unitless — Lighthouse "poor" starts above 0.25
  tbt: 600,     // ms  — Lighthouse "poor" starts above 600 ms
  perf: 0.75,   // 0-1  — below 75 means the page is in "poor" band
})

/** @type {Record<keyof typeof THRESHOLDS, string>} */
const LABELS = {
  fcp: 'First Contentful Paint',
  lcp: 'Largest Contentful Paint',
  cls: 'Cumulative Layout Shift',
  tbt: 'Total Blocking Time',
  perf: 'Performance score',
}

/**
 * Read and parse a JSON file.
 *
 * @param {string} file - Absolute path to the JSON file.
 * @returns {Record<string, unknown>} Parsed contents.
 * @throws {Error} If the file cannot be read or parsed.
 */
function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

/**
 * Extract per-metric numeric values from a Lighthouse JSON report.
 *
 * @param {Record<string, unknown>} report - Lighthouse JSON for a single page.
 * @returns {{ fcp: number, lcp: number, cls: number, tbt: number }}
 */
function extractMetrics(report) {
  const audits = /** @type {Record<string, Audit>} */ (report.audits ?? {})
  return {
    fcp: audits['first-contentful-paint']?.numericValue ?? Infinity,
    lcp: audits['largest-contentful-paint']?.numericValue ?? Infinity,
    cls: audits['cumulative-layout-shift']?.numericValue ?? Infinity,
    tbt: audits['total-blocking-time']?.numericValue ?? Infinity,
  }
}

/**
 * Collect metrics for every page scanned by unlighthouse.
 *
 * Walks the report directory tree, reading the top-level lighthouse.json
 * (homepage) plus each sub-directory's lighthouse.json.
 *
 * @param {string} reportDir - Path to the `.unlighthouse/reports` directory.
 * @param {Array<{ path: string, performance: number }>} ciResults - Summary from ci-result.json.
 * @returns {PageMetrics[]} One entry per page with extracted metric values.
 */
function collectPages(reportDir, ciResults) {
  /** @type {PageMetrics[]} */
  const pages = []

  // ci-result.json gives us the path → performance-score mapping.
  // The reports directory mirrors the URL structure: root lighthouse.json
  // for "/", sub-directories for each path segment.
  for (const entry of ciResults) {
    const segments = entry.path.split('/').filter(Boolean)
    const lhFile = join(reportDir, ...segments, 'lighthouse.json')
    if (!existsSync(lhFile)) continue

    const report = readJson(lhFile)
    const metrics = extractMetrics(report)
    pages.push({
      path: entry.path,
      ...metrics,
      perf: entry.performance ?? 0,
    })
  }

  return pages
}

/**
 * Validate every page against the metric thresholds.
 *
 * @param {PageMetrics[]} pages - Collected metrics.
 * @returns {{ passed: boolean, failures: Array<{ path: string, metric: string, value: number, threshold: number }> }}
 */
function checkBudgets(pages) {
  /** @type {Array<{ path: string, metric: string, value: number, threshold: number }>} */
  const failures = []

  for (const page of pages) {
    for (const [key, threshold] of Object.entries(THRESHOLDS)) {
      const value = /** @type {number} */ (page[/** @type {keyof PageMetrics} */ (key)])
      const ok = key === 'perf' ? value >= threshold : value <= threshold
      if (!ok) {
        failures.push({
          path: page.path,
          metric: LABELS[/** @type {keyof typeof LABELS} */ (key)],
          value,
          threshold,
        })
      }
    }
  }

  return { passed: failures.length === 0, failures }
}

/**
 * Format a metric value for display (human-readable).
 *
 * @param {number} value - The raw numeric value from Lighthouse.
 * @param {boolean} isScore - True for 0-1 scores, false for ms/unitless.
 * @returns {string} Formatted value (e.g. "2.3s", "0.039", "0.87").
 */
function formatValue(value, isScore = false) {
  if (isScore) return value.toFixed(2)
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`
  return value.toFixed(3)
}

/**
 * Build a markdown summary table for CI MR/PR comments.
 *
 * @param {PageMetrics[]} pages - Collected metrics.
 * @param {Record<string, string>} [extra] - Optional metadata (sha, passed, violationCount).
 * @returns {string} Markdown-formatted report.
 */
function buildMarkdownReport(pages, extra = {}) {
  const { passed = true, violationCount = 0 } = extra
  const icon = passed ? '✅' : '❌'
  const status = passed ? 'All pages within budget' : `${violationCount} budget violation(s)`

  /** @param {number} v @param {number} threshold @param {boolean} isScore */
  const cell = (v, threshold, isScore = false) => {
    const ok = isScore ? v >= threshold : v <= threshold
    return `${ok ? '✅' : '❌'} \`${formatValue(v, isScore)}\``
  }

  const rows = pages
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(
      (p) =>
        `| \`${p.path}\` | ${cell(p.fcp, THRESHOLDS.fcp)} | ${cell(p.lcp, THRESHOLDS.lcp)} | ${cell(p.cls, THRESHOLDS.cls)} | ${cell(p.tbt, THRESHOLDS.tbt)} | ${cell(p.perf, THRESHOLDS.perf, true)} |`,
    )
    .join('\n')

  return [
    `<!-- unlighthouse-report -->`,
    `### ${icon} Lighthouse Audit · \`${extra.sha ?? 'unknown'}\``,
    '',
    `**${status}** — ${pages.length} pages scanned.`,
    '',
    '| Route | FCP | LCP | CLS | TBT | Perf |',
    '| --- | --- | --- | --- | --- | --- |',
    rows,
    '',
    `Thresholds: FCP ≤ ${formatValue(THRESHOLDS.fcp)}, LCP ≤ ${formatValue(THRESHOLDS.lcp)}, CLS ≤ ${THRESHOLDS.cls}, TBT ≤ ${formatValue(THRESHOLDS.tbt)}, Perf ≥ ${THRESHOLDS.perf.toFixed(2)}`,
  ].join('\n')
}

// --- main ------------------------------------------------------------------

// Parse args: positional = report dir, --markdown <path> = write markdown summary
/** @type {string | undefined} */
let markdownPath
const args = process.argv.slice(2).filter((a, i, arr) => {
  if (a === '--markdown') {
    markdownPath = arr[i + 1]
    return false
  }
  if (arr[i - 1] === '--markdown') return false
  return true
})

const reportRoot = resolve(args[0] ?? '.unlighthouse')
const ciResultPath = join(reportRoot, 'ci-result.json')
const reportsDir = join(reportRoot, 'reports')

if (!existsSync(ciResultPath)) {
  console.error(`✗ ci-result.json not found at ${ciResultPath}`)
  console.error('  Run unlighthouse-ci first, then pass the .unlighthouse dir.')
  process.exit(1)
}

if (!existsSync(reportsDir)) {
  console.error(`✗ reports/ directory not found at ${reportsDir}`)
  process.exit(1)
}

/** @type {Array<{ path: string, performance: number }>} */
const ciResults = readJson(ciResultPath)
const pages = collectPages(reportsDir, ciResults)

if (pages.length === 0) {
  console.error('✗ No page reports found — unlighthouse may have failed to scan.')
  process.exit(1)
}

// Print a summary table for visibility.
console.log('\nLighthouse metric budgets')
console.log('─'.repeat(80))
for (const page of pages) {
  const fmt = (v, threshold, unit = '') => {
    const ok = unit === 'score' ? v >= threshold : v <= threshold
    return `${ok ? '✓' : '✗'} ${v >= 1000 ? (v / 1000).toFixed(1) + 's' : v.toFixed(3)}${unit === 'score' ? '' : ''}`
  }
  console.log(
    `  ${page.path.padEnd(50)} ` +
    `FCP ${fmt(page.fcp, THRESHOLDS.fcp).padEnd(8)} ` +
    `LCP ${fmt(page.lcp, THRESHOLDS.lcp).padEnd(8)} ` +
    `CLS ${fmt(page.cls, THRESHOLDS.cls).padEnd(8)} ` +
    `TBT ${fmt(page.tbt, THRESHOLDS.tbt).padEnd(8)} ` +
    `Perf ${page.perf.toFixed(2)}`,
  )
}

const { passed, failures } = checkBudgets(pages)

// Write markdown report for CI MR/PR comment (always, pass or fail).
if (markdownPath) {
  const markdown = buildMarkdownReport(pages, {
    sha: process.env.CI_COMMIT_SHORT_SHA ?? undefined,
    passed,
    violationCount: failures.length,
  })
  writeFileSync(markdownPath, markdown + '\n', 'utf8')
  console.log(`\nMarkdown report written to ${markdownPath}`)
}

if (passed) {
  console.log(`\n✓ All ${pages.length} pages within budget.\n`)
  process.exit(0)
}

console.error(`\n✗ ${failures.length} budget violation(s):\n`)
for (const f of failures) {
  const display = f.value >= 1000
    ? `${(f.value / 1000).toFixed(2)}s`
    : f.value.toFixed(3)
  console.error(`  ${f.path}  ${f.metric}: ${display} (threshold ${f.threshold})`)
}
console.error('')
process.exit(1)
