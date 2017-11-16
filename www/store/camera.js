export const state = () => ({
  active: 'primary'
})

export const mutations = {
  set (state, camera) {
    // Set the active camera.
    state.active = (document.querySelector('#camera--' + camera) === null) ? 'primary' : camera
  }
}
