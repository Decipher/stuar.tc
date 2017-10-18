<template>
  <a-entity v-if="delta === 0" id="index">

    <!-- Entity teaser component. -->
    <scvr-entity-teaser
      v-for="(entity, uuid, delta) in $store.state.index"

      :delta="delta"
      :disabled="disabled"
      :entity="entity"
      :key="uuid"
      :position="teaserPos(delta)"
      :rotation="teaserRot(delta)" />

    <!-- Controls - Pager component -->
    <scvr-controls-pager
      v-if="!responsive.vr && ($mq.resize && $mq.below(this.$mv.sm))"

      @pagerNext="pagerNext()"
      @pagerPrev="pagerPrev()"

      :position="pagerPos()" />

    <!-- Only show title if this is the active layer and not in VR mode. -->
    <scvr-text
      v-if="delta === 0 && !responsive.vr"

      :position="titlePos()"

      id="#title"
      rotation="0 0 -90"
      width="100"
    >Index</scvr-text>

  </a-entity>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    computed: {
      disabled () {
        return this.delta !== 0
      },

      ...mapState({
        responsive: state => state.responsive
      })
    },

    data () {
      return {
        pagerOffset: 0
      }
    },

    methods: {
      pagerNext () {
        this.pagerOffset = this.pagerOffset === 2 ? 0 : this.pagerOffset + 1
      },

      pagerPrev () {
        this.pagerOffset = this.pagerOffset === 0 ? 2 : this.pagerOffset - 1
      },

      // Pager - Position.
      pagerPos () {
        if (!this.responsive.vr && this.$mq.resize && this.$mq.below(this.$mv.sm)) {
          // < SM: Y = 17.5.
          return `0 -23.5 17.5`
        }

        // VR: Y = -33.
        return `0 0 -33`
      },

      // Teaser - Position.
      teaserPos (delta) {
        let row = -Math.floor(delta / 3)
        let col = delta % 3

        // Responsive positioning.
        if (!this.responsive.vr && this.$mq.resize) {
          // < SM: Y = ~17.5.
          if (this.$mq.below(this.$mv.sm)) {
            col = col + this.pagerOffset > 2 ? col + this.pagerOffset - 3 : col + this.pagerOffset

            return `0 ${(row - 1) * (10 + 1) + 16 + col * 2} ${17.5 - col * 2.5}`
          }

          // >= SM: Y = -25.
          return `${(col - 1) * (20 + 1)} ${(row - 1) * (10 + 1) + 20} -25`
        }

        // VR: Y = -33.
        return `0 0 -33`
      },

      // Teaser - Rotation.
      teaserRot (delta) {
        if (!this.responsive.vr) {
          return `0 0 0`
        }

        return `0 ${360 / 9 * delta} 0`
      },

      // Title - Position.
      titlePos () {
        let coordX = 0
        let coordY = 0
        let coordZ = 0

        if (this.$mq.resize) {
          // < SM.
          if (this.$mq.below(this.$mv.sm)) {
            coordX = 12.5
            coordY = 11.15
            coordZ = 17.5

          // >= SM.
          } else {
            coordX = 33.65
            coordY = 14.95
            coordZ = -25
          }
        }

        return `${coordX} ${coordY} ${coordZ}`
      }
    },

    props: ['data', 'delta']
  }
</script>
