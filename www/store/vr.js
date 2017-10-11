export const state = () => ({
  status: false
})

export const mutations = {
  set (state, status) {
    state.status = status
  }
}
