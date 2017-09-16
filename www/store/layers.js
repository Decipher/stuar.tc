export const state = () => ({
  index: []
})

export const mutations = {
  add (state, { type, data }) {
    state.index.unshift({ type: type, data: data })
  },

  remove (state) {
    state.index.shift()
  }
}
