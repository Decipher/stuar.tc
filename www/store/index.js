export const state = () => ({
  index: {},
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
  // Add assets to Vuex store.
  set (state, { type, value }) {
    if (typeof state[type] !== 'undefined') {
      state[type] = value
    }
  }
}
