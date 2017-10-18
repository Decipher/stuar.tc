export const state = () => ({
  mode: 'desktop',
  vr: false
})

export const mutations = {
  set (state, mode) {
    state.mode = mode
    state.vr = mode === 'vr'
  }
}
