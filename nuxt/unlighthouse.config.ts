/**
 * Unlighthouse configuration — SEO/performance audit over the generated site.
 *
 * Run via the `lint:seo` mise task or the CI `audit:seo` job, both of which
 * `generate` the site, serve `dist/` on :4000, then audit it.
 * Plain object (no helper import) so this stays decoupled from the
 * unlighthouse runtime API surface.
 */

export default {
  site: 'http://localhost:4000',
  scanner: {
    // The site is a small static SSG; crawl discovered pages (no sitemap).
    sitemap: false,
  },
  // One page at a time. The default is `floor(os.cpus().length / 2)`, which is
  // 9 on the runner host, so nine headless Chrome instances measured each
  // other's CPU contention rather than the site. That is what a Lighthouse
  // performance score and TBT are most sensitive to, which is why audit:seo
  // was the only job failing while build, test, visual and audit:size passed:
  // a static site was reporting TBT of 2.2s and 4.5s, and a different
  // arbitrary subset of pages breached the budget on every run. Slower, and
  // the number it reports now means something.
  puppeteerClusterOptions: {
    maxConcurrency: 1,
  },

  ci: {
    // Minimum overall Lighthouse score per page (0-100).  Gates on the
    // summary score; per-metric gating (FCP, CLS, etc.) is handled by
    // scripts/audit-budgets.mjs which runs after unlighthouse in CI.
    budget: 75,
    buildStatic: true,
  },
}
