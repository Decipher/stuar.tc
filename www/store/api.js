import axios from 'axios'

export const state = () => ({
  loading: false,
  url: 'http://api.sc.docksal'
})

export const mutations = {
  loading (state, value) {
    state.loading = value
  }
}

export const actions = {
  async get ({ state, commit, dispatch }, { endpoint, callback }) {
    commit('loading', true)
    let url = endpoint.substring(0, state.url.length) === state.url ? endpoint : state.url + endpoint
    console.log(url)
    return axios.get(url)
      .then((res) => {
        commit('loading', false)
        callback(res)
      })
  }
}
