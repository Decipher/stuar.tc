/**
 * Unlighthouse configuration — SEO/performance audit over the generated site.
 *
 * Run via the `lint:seo` mise task or the CI `lint:seo` job, both of which
 * `generate` the site, serve `.output/public` on :4000, then audit it.
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
    // Build a static report. budget: 0 means no minimum score is enforced, so
    // the job fails only if unlighthouse itself cannot run (e.g. Chrome launch).
    budget: 0,
    buildStatic: true,
  },
}
