export const state = () => ({
  index: {}
})

export const actions = {
  // Get the site Index.
  index ({ state, commit }, data) {
    for (let i in data) {
      state.index[data[i].uuid] = data[i]

      // Add the item thumbnail as an asset.
      commit('assets/add', {
        type: 'img',
        src: state.api.url + data[i].thumb,
        uuid: data[i].uuid
      })
    }
  }
}
