<template>
  <a-scene
    antialias="true"
    inspector="url: https://aframe.io/releases/0.3.0/aframe-inspector.min.js">
    <scvr-assets></scvr-assets>
    <a-sky color="#FFF"></a-sky>
    <a-camera
      :look-controls="`enabled: ${lookControls}`"

      mouse-cursor
      wasd-controls="enabled: false">
      <scvr-loading v-if="loading" />
    </a-camera>
    <scvr-controls />

    <nuxt />
  </a-scene>
</template>

<script>
  import 'aframe-mouse-cursor-component'

  // Custom components.
  import scvrAssets from '~/components/aframe.assets.vue'
  import scvrControls from '~/components/controls.vue'
  import scvrLoading from '~/components/loading.vue'

  export default {
    components: {
      scvrAssets,
      scvrControls,
      scvrLoading
    },

    computed: {
      loading () {
        return this.$store.state.api.loading
      }
    },

    data () {
      return {
        lookControls: false
      }
    }
  }
</script>

<style lang="scss">
a-scene {
  position: inherit;
}
</style>
