<template>
  <a-entity
    id="controls"
    position="-22 15 -20">

    <scvr-button
      v-if="layers.length > 1"

      @click="close()"
      
      width="50">&lt; Back</scvr-button>
  </a-entity>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        layers: state => state.layers.index
      })
    },

    methods: {
      close () {
        this.$store.commit('layers/remove')
      }
    }
  }
</script>
