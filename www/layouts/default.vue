<template>
  <div id="app">
    <!-- Vue-Resize observer component. -->
    <resize-observer @notify="resize" />

    <!-- Navbar component. -->
    <scvr-navbar />

    <!-- A-Frame VR scene. -->
    <a-scene
      @enter-vr="VREnter"
      @exit-vr="VRExit"

      antialias="true"
      embedded
      inspector="url: https://aframe.io/releases/0.3.0/aframe-inspector.min.js">

      <!-- A-Frame assets component. -->
      <scvr-assets></scvr-assets>

      <a-sky color="#FFF"></a-sky>
      <a-camera
        :look-controls="`enabled: ${vr.status}`"
        :position="position"

        mouse-cursor
        wasd-controls="enabled: false">
        <scvr-loading v-if="loading" />
      </a-camera>

      <!-- VR mode only controls component. -->
      <scvr-controls-vr v-if="vr.status" />

      <nuxt />
    </a-scene>
  </div>
</template>

<script>
  import 'aframe-mouse-cursor-component'
  import { mapMutations, mapState } from 'vuex'

  export default {
    components: require('~/components'),

    computed: {
      ...mapState({
        loading: state => state.api.loading,
        vr: state => state.vr
      })
    },

    data () {
      return {
        position: false
      }
    },

    methods: {
      resize () {
        let height = document.documentElement.clientHeight
        let width = document.documentElement.clientWidth

        let ratio = height / width
        let modifier = ratio - (9 / 16)

        // Initial -3.6 Y-axis coordinate for vertical centering when not in VR.
        let coordY = this.vr.status ? -1.8 : -3.6

        this.position = `0 ${coordY} ${modifier * 50}`
      },

      VREnter () {
        this.vrSet(true)
        // this.$root.vr = AFRAME.utils.isMobile();
      },

      VRExit () {
        this.vrSet(false)
      },

      ...mapMutations({
        vrSet: 'vr/set'
      })
    },

    mounted () {
      this.resize()
    }
  }
</script>

<style lang="scss">
  html, body, #__nuxt, #app {
    height: 100%;
  }

  a-scene {
    position: absolute;
    top: 0;
  }
</style>
