import AFRAME from 'aframe'

export const state = () => ({
  breakpoint: false,
  vr: {
    active: false,
    desktop: false,
    mobile: false
  },
  changed: new Date()
})

export const mutations = {
  breakpointSet (state, { $mq, $mv }) {
    let orig = state.breakpoint

    let breakpoints = ['xs', 'sm', 'md', 'lg', 'xl']
    for (let i in breakpoints) {
      if ($mq.below($mv[breakpoints[parseInt(i) + 1]]) && breakpoints[i] !== 'xl') {
        state.breakpoint = breakpoints[i]
        break
      }
      state.breakpoint = 'xl'
    }

    if (orig !== state.breakpoint) {
      state.changed = new Date()
    }
  },

  vrSet (state, value) {
    let orig = state.vr.active

    state.vr.active = value
    state.vr.desktop = value && !AFRAME.utils.device.isMobile()
    state.vr.mobile = value && AFRAME.utils.device.isMobile()

    if (orig !== state.vr.active) {
      state.changed = new Date()
    }
  }
}
