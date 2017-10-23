export const state = () => ({
  breakpoint: false,
  vr: false
})

export const mutations = {
  breakpointSet (state, { $mq, $mv }) {
    switch (true) {
      case $mq.below($mv.sm):
        state.breakpoint = 'xs'
        break

      case $mq.below($mv.md):
        state.breakpoint = 'sm'
        break

      case $mq.below($mv.lg):
        state.breakpoint = 'md'
        break

      case $mq.below($mv.xl):
        state.breakpoint = 'lg'
        break

      default:
        state.breakpoint = 'xl'
    }
  },

  vrSet (state, value) {
    state.vr = value
  }
}
