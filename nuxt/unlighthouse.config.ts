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
  ci: {
    // Minimum overall Lighthouse score per page (0-100).  Gates on the
    // summary score; per-metric gating (FCP, CLS, etc.) is handled by
    // scripts/audit-budgets.mjs which runs after unlighthouse in CI.
    budget: 75,
    buildStatic: true,
  },
}
