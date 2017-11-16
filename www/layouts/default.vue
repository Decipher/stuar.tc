<template>
  <div id="app" class="bg-dark">

    <!-- Navbar component. -->
    <scvr-navbar />

    <!-- A-Frame VR scene. -->
    <a-scene
      @enter-vr="vrEnter"
      @exit-vr="vrExit"

      antialias="true"
      embedded>

      <scvr-camera id="primary" />

      <!-- A-Frame assets component. -->
      <scvr-assets />

      <!-- Background / Sky. -->
      <a-sky color="#FFF" />

      <!-- Nuxt component. -->
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
        responsive: state => state.responsive
      })
    },

    methods: {
      // Event - $mq.resize.
      eventResize () {
        // Update responsive breakpoint.
        this.responsiveBreakpoint(this)
      },

      // VR - Enter.
      vrEnter () {
        this.responsiveVR(true)
      },

      // VR - Exit.
      vrExit () {
        this.responsiveVR(false)
        this.eventResize()
      },

      // Stored methods.
      ...mapMutations({
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
