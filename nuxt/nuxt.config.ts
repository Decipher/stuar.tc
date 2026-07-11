export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  modules: [
    '@nuxt/ui',
    '@stuartclark/ui',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    'nuxt-cloudflared-tunnel',
  ],

  css: ['~/assets/css/main.css'],

  cloudflaredTunnel: {
    storybook: true,
    checkPorts: true,
  },

  routeRules: {
    '/**': { prerender: true },
  },

  nitro: {
    output: {
      publicDir: 'dist',
    },
  },
})
