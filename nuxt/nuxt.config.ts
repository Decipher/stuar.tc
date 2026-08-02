export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  site: {
    // Netlify sometimes builds `main` as a non-production deploy. That makes
    // DEPLOY_PRIME_URL resolve to a netlify.app branch URL, not the real
    // domain (confirmed live on stuar.tc/sitemap.xml). BRANCH stays correct
    // regardless, so pin `main` to the canonical domain directly. Other
    // branches keep DEPLOY_PRIME_URL, so their preview links still work.
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
      // Follow links on each page during the build. This finds and builds
      // dynamic routes like /writing/<slug>, which Nuxt's scanner skips.
      // The netlify preset does not turn this on by default (static does).
      crawlLinks: true,
      // RSS and sitemap links live in <head>, not in page links — the
      // crawler above will not find them. List them here directly. Listing
      // /sitemap.xml also forces @nuxtjs/sitemap to build it as a static
      // file, instead of generating it at runtime inside the Netlify
      // function, which cannot read the content database (nuxt/content#3805).
      routes: ['/blog.xml', '/planet-drupal.xml', '/sitemap.xml'],
    },
  },
})
