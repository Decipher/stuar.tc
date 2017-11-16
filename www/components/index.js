import Vue from 'vue'

// Components.
import scvrAssets from '~/components/aframe--assets.vue'
import scvrCamera from '~/components/camera.vue'
import scvrEntityTeaser from '~/components/entity--teaser.vue'
import scvrLoading from '~/components/loading.vue'
import scvrNavbar from '~/components/navbar.vue'

// Controls.
import scvrControlsCursor from '~/components/controls--cursor.vue'
import scvrControlsHudVrDesktop from '~/components/controls--hud--vr--desktop.vue'
import scvrControlsHudVrMobile from '~/components/controls--hud--vr--mobile.vue'
import scvrControlsPager from '~/components/controls--pager.vue'

// Elements.
import scvrButton from '~/components/elements/button.vue'
import scvrText from '~/components/elements/text.vue'

let components = {
  scvrAssets,
  scvrCamera,
  scvrEntityTeaser,
  scvrLoading,
  scvrNavbar,

  // Controls.
  scvrControlsCursor,
  scvrControlsHudVrDesktop,
  scvrControlsHudVrMobile,
  scvrControlsPager,

  // Elements.
  scvrButton,
  scvrText
}

const scvrComponents = {
  install: function (Vue) {
    if (Vue._scvr_components_installed) {
      return
    }

    Vue._scvr_components_installed = true

    // Register components
    for (var component in components) {
      Vue.component(component, components[component])
    }
  }
}

Vue.use(scvrComponents)
