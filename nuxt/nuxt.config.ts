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
  ],

  css: ['~/assets/css/main.css'],

  ogImage: {
    defaults: {
      width: 1200,
      height: 630,
    },
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
  },
})
