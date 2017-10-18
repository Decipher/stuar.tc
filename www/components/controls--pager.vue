<template>
  <a-entity id="pager">
    <!-- Previous -->
    <scvr-button
      @click="$emit('pagerPrev')"

      :position="prevPos()"
      :rotation="prevRot()"
      :width="prevWidth()"

      value="< Prev" />

    <!-- Next -->
    <scvr-button
      @click="$emit('pagerNext')"

      :position="nextPos()"
      :rotation="nextRot()"
      :width="nextWidth()"

      value="Next >" />
  </a-entity>
</template>

<script>
export default {
  methods: {
    // Next - Position.
    nextPos () {
      return `11.75 6.5 0`
    },

    // Next - Rotation.
    nextRot () {
      return `0 0 -90`
    },

    // Next - Width.
    nextWidth () {
      return `42`
    },

    // Previous - Position.
    prevPos () {
      return `-11.75 28.5 0`
    },

    // Previous - Rotation.
    prevRot () {
      return `0 0 -90`
    },

    // Previous - Width.
    prevWidth () {
      return `42`
    }
  }
}
</script>

<style scoped>

</style>
