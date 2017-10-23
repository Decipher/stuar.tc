export const state = () => ({
  index: {},
  cameraLook: false,
  wasdControls: false
})

export const actions = {
  // Get the site Index.
  index ({ state, commit }, data) {
    for (let i in data) {
      state.index[data[i].id] = data[i]

      // Add the item as an asset.
      commit('assets/add', {
        type: 'img',
        src: data[i].image.url._original,
        uuid: data[i].image.id
      })

      // Add the item thumbnail as an asset.
      commit('assets/add', {
        type: 'img',
        src: data[i].image.url.thumbnail,
        uuid: data[i].image.id,
        modifier: 'thumbnail'
      })
    }
  }
}

export const mutations = {
  cameraLook (state, value) {
    state.cameraLook = value
  },

  // Set the WASD Controls state.
  wasdSet (state, value) {
    state.wasdControls = value
  }
}
