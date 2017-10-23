<template>
  <div id="app" class="bg-dark">
    <!-- Navbar component. -->
    <scvr-navbar />

    <!-- A-Frame VR scene. -->
    <a-scene
      @enter-vr="vrEnter"
      @exit-vr="vrExit"

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
        :wasd-controls="`enabled: ${index.wasdControls}`"

        <!-- VR mode only controls component. -->
        <scvr-controls-vr v-if="responsive.vr" />
        mouse-cursor>

        <a-cursor v-if="cursorVis()" />
        <!-- <scvr-loading v-if="loading" /> -->
      </a-camera>

      <nuxt />
    </a-scene>
  </div>
</template>

<script>
  import AFRAME from 'aframe'
  import 'aframe-mouse-cursor-component'
  import { mapMutations, mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        // loading: state => state.api.loading,
        index: state => state,
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
      // Cursor - Visibility.
      cursorVis () {
        return this.responsive.vr && AFRAME.utils.device.isMobile()
      },

      // Event - $mq.resize.
      eventResize () {
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

      // VR - Enter.
      vrEnter () {
        this.responsiveSet('vr')
        this.lookAt = false
      },

      // VR - Exit.
      vrExit () {
        this.responsiveSet('desktop')
        this.lookAt = '0 0 180'
      },

      wasdControls () {
        return true
      },

      // Stored methods.
      ...mapMutations({
        responsiveSet: 'responsive/set'
      })
    },

    mounted () {
      this.eventResize()
    },

    watch: {
      '$mq.resize': 'eventResize'
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
