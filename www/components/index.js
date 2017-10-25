import Vue from 'vue'

// Components.
import scvrAssets from '~/components/aframe--assets.vue'
import scvrControlsHudVr from '~/components/controls--hud--vr.vue'
import scvrControlsPager from '~/components/controls--pager.vue'
import scvrEntityTeaser from '~/components/entity--teaser.vue'
import scvrLayer from '~/components/layer.vue'
import scvrLoading from '~/components/loading.vue'
import scvrNavbar from '~/components/navbar.vue'

// Elements.
import scvrButton from '~/components/elements/button.vue'
import scvrText from '~/components/elements/text.vue'

// Layers.
import scvrLayerEntity from '~/components/layers/entity.vue'
import scvrLayerIndex from '~/components/layers/index.vue'

let components = {
  scvrAssets,
  scvrControlsHudVr,
  scvrControlsPager,
  scvrEntityTeaser,
  scvrLayer,
  scvrLoading,
  scvrNavbar,

  // Elements.
  scvrButton,
  scvrText,

  // Layers.
  scvrLayerEntity,
  scvrLayerIndex
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
