import Vuex from 'vuex'

const createStore = () => {
  return new Vuex.Store({
    state: {
      img: {},
      index: {}
    },

    mutations: {
      add (state, uuid, src) {
        state.img[uuid] = src
      }
    },

    actions: {
      index ({ state, commit }, data) {
        for (let i in data) {
          state.index[data[i].uuid] = data[i]
          state.img[data[i].uuid] = data[i].thumb.replace('/sites/default', '')
        }
      }
    }
  })
}

export default createStore
