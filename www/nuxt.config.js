module.exports = {

  /**
   * Headers of the page
   */
  head: {
    title: 'Stuart Clark VR',
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {hid: 'description', name: 'description', content: 'Stuart Clark VR'}
    ],
    link: [
      {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}
    ]
  },

  /**
   * Disable server side rendering as A-Frame doesn't currently support it.
   */
  mode: 'spa',

  /**
   * Customize the progress-bar color
   */
  loading: false,

  /**
   * Build configuration
   */
  build: {
    /**
     * Run ESLINT on save
     */
    extend (config, ctx) {
      if (ctx.dev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    },

    /**
     * Add third party libraries.
     */
    vendor: ['aframe', 'axios'],
  }
    vendor: ['aframe', 'axios']
  },

  modules: [
    '@nuxtjs/bootstrap-vue'
  ],

  /**
   * CSS
   */
  /**
   * css: [
   *   '@/assets/scss/styles.scss'
   * ]
   */
}
