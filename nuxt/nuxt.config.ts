import { getAppVersion } from './scripts/getAppVersion.mjs'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  runtimeConfig: {
    public: {
      appVersion: getAppVersion(),
    },
  },

  site: {
    // Netlify sometimes builds `main` as a non-production deploy. Then
    // DEPLOY_PRIME_URL resolves to a netlify.app branch URL, not the real
    // domain. We confirmed this live on stuar.tc/sitemap.xml. BRANCH stays
    // correct in every case, so pin `main` to the canonical domain directly.
    // Other branches keep DEPLOY_PRIME_URL. Their preview links still work.
    url: process.env.BRANCH === 'main' ? 'https://stuar.tc' : (process.env.DEPLOY_PRIME_URL || 'https://stuar.tc'),
    name: 'stuar.tc',
  },

  modules: [
    '@nuxt/ui',
    '@stuartclark/ui',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    'nuxt-og-image',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    'nuxt-cloudflared-tunnel',
    'nuxt-gtag',
  ],

  css: ['~/assets/css/main.css'],

  // /typography is a visual-regression fixture (renders the prose component
  // with representative inline <code>/links) — prerendered for the Playwright
  // suite, but kept out of the public sitemap and robots-disallowed.
  //
  // autoLastmod: every static page gets <lastmod> set to the build date,
  // signalling to Google that the site is actively maintained.
  // defaults.changefreq: sitemap-wide fallback so any route not explicitly
  // overridden still carries a reasonable value.
  // urls: per-page <priority> + <changefreq> for the five static routes,
  // reflecting their relative importance (homepage highest).
  sitemap: {
    exclude: ['/typography', '/q/**'],
    autoLastmod: true,
    defaults: { changefreq: 'monthly' },
    urls: [
      { loc: '/', priority: 1.0, changefreq: 'weekly' },
      { loc: '/writing', priority: 0.9, changefreq: 'weekly' },
      { loc: '/open-source', priority: 0.8, changefreq: 'monthly' },
      { loc: '/about', priority: 0.7, changefreq: 'monthly' },
      { loc: '/community', priority: 0.7, changefreq: 'monthly' },
    ],
  },
  robots: { disallow: ['/typography'] },

  ogImage: {
    defaults: {
      width: 1200,
      height: 630,
    },
  },

  gtag: {
    id: 'G-X1BRPZD4K2',
    // Netlify sets CONTEXT (not NETLIFY_CONTEXT — that variable doesn't
    // exist) to 'production' only for the canonical production deploy;
    // 'deploy-preview' and 'branch-deploy' builds are also non-dev, so
    // !import.meta.dev alone would send preview/branch traffic into the
    // real GA4 property. Restrict to the real thing.
    enabled: process.env.CONTEXT === 'production',
  },

  cloudflaredTunnel: {
    storybook: true,
    checkPorts: true,
  },

  routeRules: {
    '/**': { prerender: true },
    '/api/**': { prerender: false },
    // Prerendering bakes these to static .xml files; the content-type set in
    // the route handler only applies to the original prerender request, not
    // to how a static host later serves the file from disk. Netlify reads
    // this into the generated _headers file — see public/serve.json for the
    // equivalent so local `serve`-based testing (Playwright) matches.
    '/blog.xml': { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } },
    '/planet-drupal.xml': { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } },

    // QR campaign tracking — /q/<path> is handled by a Nitro server route
    // (server/routes/q/[...path].ts) that 302-redirects to /<path> with UTM
    // params so GA4 attributes QR-code scans separately from direct traffic.
    // Excluded from prerendering and the sitemap (see sitemap.exclude above).
    '/q/**': {
      prerender: false,
    },

    // Redirects from the real historical article URLs (live under
    // /articles/<slug>-<created:Ymd> from 2022-03-05 onward, per pathauto's
    // own `[content-type]s/[title]-[created:Ymd]` pattern) to the new
    // /writing/<slug>-<created:Ymd> scheme now that pathauto itself has
    // been repointed at `writing/...`. Only the 4 pre-existing articles
    // need one — nothing before 2022-03-05 is confident enough to redirect
    // (the pattern was still `article/...` singular then, and the frontend
    // route prefix was `/blog` before that again — genuinely uncertain
    // territory, not fixed here), and field-tokens-200 never had an old URL.
    '/articles/hello-world-20211126': { redirect: { to: '/writing/hello-world-20211126', statusCode: 301 } },
    '/articles/layout-paragraphs-module-20220301': { redirect: { to: '/writing/layout-paragraphs-module-20220301', statusCode: 301 } },
    '/articles/what-no-images-20220315': { redirect: { to: '/writing/what-no-images-20220315', statusCode: 301 } },
    '/articles/decoupling-configuration-config-pages-20220412': { redirect: { to: '/writing/decoupling-configuration-config-pages-20220412', statusCode: 301 } },
  },

  nitro: {
    preset: 'netlify',
    prerender: {
      // Emit <route>.html instead of <route>/index.html. Every canonical
      // link, OG tag, and sitemap entry in this app uses the no-trailing-
      // slash form, but directory-style output made Netlify's static file
      // serving redirect that bare path to a trailing-slash URL before
      // ever reaching this app's own redirect rules — every sitemap URL
      // and the four legacy /articles/* redirects included. Flat files
      // make the no-slash URL the one that actually serves 200.
      autoSubfolderIndex: false,
      // Follow links on each page during the build. Nuxt's scanner skips
      // dynamic routes like /writing/<slug>. Following links finds and
      // builds them anyway. The netlify preset does not enable this by
      // default. Only the static preset does.
      crawlLinks: true,
      // RSS and sitemap links live in <head>, not in page links. The
      // crawler above will not find them there. List them here directly
      // instead. Listing /sitemap.xml also forces @nuxtjs/sitemap to build
      // it as a static file at build time. Otherwise it builds at runtime
      // inside the Netlify function. That function cannot read the content
      // database (nuxt/content#3805).
      //
      // /typography is a fixture route for the Playwright visual snapshot
      // (see tests/visual/home.spec.ts). No page links to it, so the
      // crawler cannot discover it — list it explicitly.
      routes: ['/blog.xml', '/planet-drupal.xml', '/sitemap.xml', '/typography'],
    },
  },
})
