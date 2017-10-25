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

      // Add the item assets.
      let derivatives = ['large', 'thumbnail']
      for (let j in derivatives) {
        commit('assets/add', {
          type: 'img',
          src: data[i].image.url[derivatives[j]],
          uuid: data[i].image.id,
          modifier: derivatives[j]
        })
      }
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
