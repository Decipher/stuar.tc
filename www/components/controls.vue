<template>
  <a-entity
    id="controls"
    position="-22 15 -20">
    <a-box
      v-if="layers.length > 1"

      @click="close()"

      color="red"
      depth="1"
      width="1"
      height="1"
      id="close"
    ></a-box>
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
