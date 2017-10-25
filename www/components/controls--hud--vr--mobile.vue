<template>
  <a-entity id="controls">

    <!-- Back button - top -->
    <scvr-button
      v-if="layers.length > 1"

      @click="close()"

      position="0 50 -15"
      rotation="45 0 0"
      type="round"
      width="50">&lt; Back</scvr-button>

    <!-- Back button - bottom -->
    <scvr-button
      v-if="layers.length > 1"

      @click="close()"

      position="0 -50 -15"
      rotation="-45 0 0"
      type="round"
      width="50">&lt; Back</scvr-button>

  </a-entity>
</template>

<script>
  import { mapMutations, mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        layers: state => state.layers.index
      })
    },

    methods: {
      ...mapMutations({
        close: 'layers/remove'
      })
    }
  }
</script>
