import Vue from 'vue'
import vMediaQuery from 'v-media-query'

Vue.use(vMediaQuery, {
  variables: {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  }
})
