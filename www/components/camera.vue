<template>
  <a-entity :id="`cameras--${id}`">

    <!-- Non-VR camera -->
    <a-camera
      :camera="`active: ${camera.active === id && !responsive.vr.active}`"
      :id="`camera--${id}`"

      look-controls="enabled: false"
      mouse-cursor
      wasd-controls="enabled: false" />

    <!-- VR camera -->
    <a-camera
      :camera="`active: ${camera.active === id && responsive.vr.active}`"
      :id="`camera--${id}--vr`"

      look-controls="enabled: true"
      mouse-cursor
      wasd-controls="enabled: false">

      <a-entity v-if="camera.active === id">
        <!-- VR (Desktop) heads up display controls component. -->
        <scvr-controls-hud-vr-desktop v-if="responsive.vr.desktop" />

        <a-cursor v-if="responsive.vr.mobile" />
        <!-- <scvr-loading v-if="loading" /> -->
      </a-entity>

    </a-camera>
  </a-entity>

</template>

<script>
  import { mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        camera: state => state.camera,
        responsive: state => state.responsive
      })
    },

    data () {
      return {
        show: true
      }
    },

    props: ['id']
  }
</script>