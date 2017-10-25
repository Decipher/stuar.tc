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

      <!-- Backgorund / Sky -->
      <a-sky color="#FFF" />

      <!-- A-Frame camera -->
      <a-camera
        :look-at="index.cameraLook"
        :look-controls="`enabled: ${responsive.vr.active}`"
        :position="position"
        :wasd-controls="`enabled: ${index.wasdControls}`"

        mouse-cursor>

        <!-- VR (Desktop) heads up display controls component. -->
        <scvr-controls-hud-vr-desktop v-if="responsive.vr.desktop" />

        <a-cursor v-if="cursorVis()" />
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
        index: state => state,
        responsive: state => state.responsive
      })
    },

    data () {
      return {
        position: false
      }
    },

    methods: {
      // Cursor - Visibility.
      cursorVis () {
        return this.responsive.vr.mobile
      },

      // Event - $mq.resize.
      eventResize () {
        // Update responsive breakpoint.
        this.responsiveBreakpoint(this)

        let height = document.documentElement.clientHeight
        let width = document.documentElement.clientWidth

        let ratio = height / width
        let modifier = ratio - (9 / 16)

        // VR (All).
        if (this.responsive.vr.active) {
          this.position = `0 0 -1.8`

        // XS.
        } else if (this.responsive.breakpoint === 'xs') {
          // Initial -3.6 Y-axis coordinate for vertical centering when not in VR.
          this.position = `0 -5 50`

        // > XS.
        } else {
          this.position = `0 -3.6 ${modifier * 50}`
        }
      },

      // VR - Enter.
      vrEnter () {
        this.responsiveVR(true)
        this.cameraLook(false)
      },

      // VR - Exit.
      vrExit () {
        this.responsiveVR(false)
        this.cameraLook('0 0 180')
      },

      wasdControls () {
        return true
      },

      // Stored methods.
      ...mapMutations({
        cameraLook: 'cameraLook',
        responsiveBreakpoint: 'responsive/breakpointSet',
        responsiveVR: 'responsive/vrSet'
      })
    },

    mounted () {
      this.eventResize()
    },

    watch: {
      '$mq.resize': [
        'eventResize'
      ]
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
