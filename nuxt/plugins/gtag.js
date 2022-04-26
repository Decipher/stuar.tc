// @see https://github.com/nuxt-community/gtm-module/issues/82#issuecomment-762153556

import Vue from 'vue'
import VueGtag from 'vue-gtag'

const id = 'G-X1BRPZD4K2'

export default ({ isDev, app }) => {
  if (!isDev) {
    Vue.use(VueGtag, { config: { id } }, app.router)
  } else {
    console.log('Skipping GA in development')
  }
}
