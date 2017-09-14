export const state = () => ({
  img: {}
})

export const mutations = {
  // Add assets to Vuex store.
  add (state, { type, src, uuid }) {
    if (typeof state[type] !== 'undefined') {
      state[type][uuid] = src
    }
  }
}
