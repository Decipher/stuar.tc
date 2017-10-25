<template>
  <a-entity :rotation="entityRot">
    <a-entity :position="entityPos">

      <!-- VR (Mobile) heads up display controls component. -->
      <scvr-controls-hud-vr-mobile v-if="responsive.vr.mobile" />

      <!-- Title -->
      <scvr-text align="center" position="0 17.5 0" width="64">{{ entity.title }}</scvr-text>

      <!-- Image -->
      <a-image
        :src="`#img--${entity.image.id}--large`"
        :width="entity.image.meta.width * (32 / entity.image.meta.height)"

        height="32" />

    </a-entity>
  </a-entity>
</template>

<script>
  import { mapMutations, mapState } from 'vuex'

  export default {
    // beforeDestroy () {
    //   this.wasdSet(this.wasdOrig)
    //   this.cameraSet(this.cameraOrig)
    // },

    computed: {
      entity () {
        return this.data
      },

      ...mapState({
        index: state => state,
        responsive: state => state.responsive
      })
    },

    data () {
      return {
        entityPos: false,
        entityRot: false
        // wasdOrig: false
      }
    },

    methods: {
      // Entity - Position.
      entityCalc () {
        this.entityRot = false

        switch (true) {
          // VR.
          case this.responsive.vr.active:
            this.entityPos = '0 0 -25'
            this.entityRot = `0 ${360 / 9 * this.entity.delta} 0`
            break

          // XS.
          case this.responsive.breakpoint === 'xs':
            this.entityPos = '0 0 0'
            break

          // >= SM.
          default:
            this.entityPos = `0 0 -20`
        }
      },

      // Event - VR state change.
      eventVR () {
        // Toggle WASD controls for this layer.
        this.wasdSet(this.responsive.vr.mobile)
      },

      // Stored methods.
      ...mapMutations({
        wasdSet: 'wasdSet'
      })
    },

    mounted () {
      // Store original WASD controls state.
      // this.wasdOrig = this.index.wasdControls

      this.eventVR()
      this.entityCalc()
    },

    props: ['data', 'delta'],

    watch: {
      'responsive.vr.active': [
        'eventVR',
        'entityCalc'
      ],
      '$mq.resize': 'entityCalc'
    }
  }
</script>
