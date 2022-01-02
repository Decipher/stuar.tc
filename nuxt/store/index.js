export default {
  actions: {
    async nuxtServerInit({ dispatch }, { $druxt }) {
      await dispatch('config/init', { $druxt })
    },
  },
}
