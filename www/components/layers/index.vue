<template>
  <a-entity v-if="delta === 0" id="index">

    <!-- Entity teaser components. -->
    <a-entity
      :position="wrapperPos()"

      id="teasers">
      <scvr-entity-teaser
        v-for="(entity, uuid, delta) in $store.state.index"

        :delta="delta"
        :disabled="disabled"
        :entity="entity"
        :key="uuid"
        :position="teaserPos(delta)"
        :rotation="teaserRot(delta)" />

        <!-- Animation: Adjust teasers rotation as per pager. -->
        <a-animation
          v-if="animPlay"

          @animationend='animPlay = false'

          :attribute="animAttribute"
          :from="`${animFrom} 0 0`"
          :to="`${animTo} 0 0`" />

      </a-entity>

    <!-- Controls - Pager component -->
    <scvr-controls-pager
      v-if="!responsive.vr.active && ($mq.resize && $mq.below(this.$mv.sm))"

      @pagerNext="pagerNext()"
      @pagerPrev="pagerPrev()"

      :position="pagerPos()" />

    <!-- Only show title if this is the active layer and not in VR mode. -->
    <scvr-text
      v-if="delta === 0 && !responsive.vr.active"

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
        animAttribute: 'rotation',
        animFrom: 0,
        animPlay: false,
        animTo: 0
      }
    },

    methods: {
      // Animate.
      animate (from, to, attribute) {
        this.animFrom = from
        this.animTo = to
        this.animAttribute = attribute
        this.animPlay = true
      },

      // Event - $mq.resize.
      eventResize () {
        // > XS.
        if (this.responsive.breakpoint !== 'xs') {
          this.animate(0, 0, 'rotation')
        }
      },

      // Pager - Next event.
      pagerNext () {
        this.animate(this.animTo, this.animTo + 120, 'rotation')
      },

      // Pager - Previous event.
      pagerPrev () {
        this.animate(this.animTo, this.animTo - 120, 'rotation')
      },

      // Pager - Position.
      pagerPos () {
        // XS: Y = 17.5.
        if (!this.responsive.vr.active && this.responsive.breakpoint === 'xs') {
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
        if (!this.responsive.vr.active) {
          // XS: Y = 17.5.
          if (this.responsive.breakpoint === 'xs') {
            return `0 ${(row - 1) * (10 + 1) + 22} 17.5`
          }

          // >= SM: Y = -25.
          return `${(col - 1) * (20 + 1)} ${(row - 1) * (10 + 1) + 20} -25`
        }

        // VR: Y = -33.
        return `0 0 -33`
      },

      // Teaser - Rotation.
      teaserRot (delta) {
        if (!this.responsive.vr.active) {
          // XS.
          if (this.responsive.breakpoint === 'xs') {
            return `${(delta % 3) * 120} 0 0`
          }

          // >= SM.
          return `0 0 0`
        }

        // VR.
        return `0 ${360 / 9 * delta} 0`
      },

      // Title - Position.
      titlePos () {
        let coordX = 0
        let coordY = 0
        let coordZ = 0

        if (!this.responsive.vr.active) {
          // XS.
          if (this.responsive.breakpoint === 'xs') {
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
      },

      // Wrapper - Position.
      wrapperPos () {
        // XS.
        if (this.responsive.breakpoint === 'xs') {
          return '0 -6 0'
        }

        // >= SM.
        return '0 0 0'
      }

    },

    props: ['data', 'delta'],

    watch: {
      '$mq.resize': 'eventResize'
    }
  }
</script>
