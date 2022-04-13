import feedFactory from './feeds'

const baseUrl = process.env.BASE_URL || 'http://stuartclark.ddev.site'

export default {
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Stuart Clark',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // Next Image module https://image.nuxtjs.org/components/nuxt-img
    ['@nuxt/image', { domains: [baseUrl] }],
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    '@nuxtjs/feed',
    '@nuxtjs/markdownit',
    '@nuxtjs/moment',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    '@nuxtjs/tailwindcss',
    // DruxtJS: https://druxtjs.org
    '@druxt-contrib/config-pages',
    'druxt-layout-paragraphs',
    'druxt-site',
  ],

  // DruxtJS: https://druxtjs.org
  druxt: {
    baseUrl,
    // @druxt-contrib/config-pages module settings.
    configPages: { pages: ['druxt_settings'] },
    // Disable deprecated Entity fields.
    entity: { components: { fields: false } },
    router: { middleware: false },
    proxy: { api: true },
    // Set the default theme to render Site regions.
    site: { theme: 'bartik' },
    views: { query: { bundleFilter: true } },
  },

  // Feed module: https://github.com/nuxt-community/feed-module
  feed: {
    factory: () => feedFactory({ baseUrl }),
  },

  markdownit: {
    // Support `$md()`
    runtime: true,
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  storybook: {
    stories: [
      '~/components/**/*.stories.js',
      '~/layouts/**/*.stories.js',
      '~/pages/**/*.stories.js',
    ],
  },
}
