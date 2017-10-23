<template>
  <a-entity>
    <!-- Image -->
    <a-image
      :src="`#img-${entity.image.id}`"
      :width="entity.image.meta.width * (32 / entity.image.meta.height)"

      height="32" />
  </a-entity>
</template>

<script>
  import AFRAME from 'aframe'
  import { mapMutations, mapState } from 'vuex'

  export default {
    computed: {
      entity () {
        return this.data
      },

      ...mapState({
        responsive: state => state.responsive
      })
    },

    methods: {
      eventVR () {
        this.indexSet({type: 'wasdControls', value: this.responsive.vr && !AFRAME.utils.device.isMobile()})
      },

      // Stored methods.
      ...mapMutations({
        indexSet: 'set'
      })
    },

    mounted () {
      this.eventVR()
    },

    props: ['data', 'delta'],

    watch: {
      'responsive.vr': 'eventVR'
    }
  }
</script>
