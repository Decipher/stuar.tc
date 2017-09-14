import axios from 'axios'

export const state = () => ({
  url: 'http://api.sc.docksal'
})

export const actions = {
  get ({ state, commit }, { endpoint, callback }) {
    let url = state.url + endpoint
    return axios.get(url)
      .then(callback)
  }
}
