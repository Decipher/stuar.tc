<template>
  <div id="app" class="bg-dark">
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
      <scvr-assets />

      <a-sky color="#FFF" />
      <a-camera
        :look-at="lookAt"
        :look-controls="`enabled: ${responsive.vr}`"
        :position="position"

        mouse-cursor
        wasd-controls="enabled: false">
        <!-- VR mode only controls component. -->
        <scvr-controls-vr v-if="responsive.vr" />

        <a-cursor v-if="responsive.vr" />
        <!-- <scvr-loading v-if="loading" /> -->
      </a-camera>

      <nuxt />
    </a-scene>
  </div>
</template>

<script>
  import 'aframe-mouse-cursor-component'
  import { mapMutations, mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        // loading: state => state.api.loading,
        responsive: state => state.responsive
      })
    },

    data () {
      return {
        lookAt: false,
        position: false
      }
    },

    methods: {
      resize () {
        let height = document.documentElement.clientHeight
        let width = document.documentElement.clientWidth

        let ratio = height / width
        let modifier = ratio - (9 / 16)

        // VR.
        if (this.responsive.vr) {
          this.position = `0 0 -1.8`

        // < SM.
        } else if (this.$mq.below(576)) {
          // Initial -3.6 Y-axis coordinate for vertical centering when not in VR.
          this.position = `0 -5 50`

        // >= SM.
        } else {
          this.position = `0 -3.6 ${modifier * 50}`
        }
      },

      VREnter () {
        this.responsiveSet('vr')
        this.lookAt = false
        // this.$root.vr = AFRAME.utils.isMobile();
      },

      VRExit () {
        this.responsiveSet('desktop')
        this.lookAt = '0 0 180'
      },

      ...mapMutations({
        responsiveSet: 'responsive/set'
      })
    },

    mounted () {
      this.resize()
    },

    watch: {
      '$mq.resize': 'resize'
    }
  }
</script>

<style>
  html, body, #__nuxt, #app {
    height: 100%;
  }

  a-scene {
    position: absolute;
    top: 0;
  }
</style>
