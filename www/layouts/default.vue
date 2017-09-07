<template>
  <a-scene
    antialias="true"
    inspector="url: https://aframe.io/releases/0.3.0/aframe-inspector.min.js">
    <a-assets>
      <img
        v-if="$store.state.img"
        v-for="(src, uuid) in $store.state.img"

        :id="`img-${uuid}`"
        :src="src" />
    </a-assets>
    <a-camera
      mouse-cursor
      wasd-controls="enabled: false">
    </a-camera>

    <nuxt />
  </a-scene>
</template>

<script>
  import 'aframe-mouse-cursor-component'

  export default {}
</script>
