<template>
  <a-scene
    antialias="true"
    inspector="url: https://aframe.io/releases/0.3.0/aframe-inspector.min.js">
    <scvr-assets></scvr-assets>
    <a-camera
      mouse-cursor
      wasd-controls="enabled: false">
    </a-camera>

    <nuxt />
  </a-scene>
</template>

<script>
  import 'aframe-mouse-cursor-component'

  // Custom components.
  import scvrAssets from '~/components/aframe.assets.vue'

  export default {
    components: {
      scvrAssets
    }
  }
</script>
