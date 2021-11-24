const baseUrl = process.env.BASE_URL

export default {
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Stuart Clark',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    '@nuxtjs/moment',
    '@nuxtjs/tailwindcss',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    'druxt-site',
  ],

  // DruxtJS: https://druxtjs.org
  druxt: {
    baseUrl,
    // Disable deprecated Entity fields.
    entity: { components: { fields: false }},
    router: { middleware: false },
    proxy: { api: true },
    // Set the default theme to render Site regions.
    site: { theme: 'bartik' },
    views: { query: { bundleFilter: true }},
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
