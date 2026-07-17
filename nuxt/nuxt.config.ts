export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  site: {
    // Netlify's URL env var is always the site's primary (production) URL —
    // not context-aware. DEPLOY_PRIME_URL is the one that resolves to the
    // deploy-preview/branch-deploy URL in those contexts (and to the same
    // production URL in production), so OG image and sitemap URLs resolve
    // correctly on preview deploys. Falls back to production for non-Netlify
    // builds (e.g. GitLab CI, local dev).
    url: process.env.DEPLOY_PRIME_URL || 'https://stuar.tc',
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
  },

  nitro: {
    preset: 'netlify',
    prerender: {
      // The RSS feeds are only linked via <link rel="alternate"> in the
      // <head>, which the crawler-based prerenderer doesn't follow (it
      // only discovers routes reachable via in-page <a href> links) — list
      // them explicitly so they end up in the static build.
      routes: ['/blog.xml', '/planet-drupal.xml'],
    },
  },
})
