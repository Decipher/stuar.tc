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

      // Add the item thumbnail asset.
      commit('assets/add', {
        type: 'img',
        src: data[i].image.url['thumbnail'],
        uuid: data[i].image.id,
        modifier: 'thumbnail'
      })
    }
  }
}
