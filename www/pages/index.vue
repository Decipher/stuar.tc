<template>
  <a-entity
    v-if="layers.length > 0"

    id="layers">
    <scvr-layer
      v-for="({type, data}, delta) in layers"

      :data="data"
      :delta="delta"
      :key="`layer-${delta}`"
      :type="type"
    ></scvr-layer>
  </a-entity>
</template>

<script>
  // Import the layer management component.
  import scvrLayer from '~/components/layer.vue'

  export default {
    // Register the layer management component.
    components: { scvrLayer },

    computed: {
      // Return the layers from the layers store.
      layers () {
        return this.$store.state.layers.index
      }
    },

    // Fetch index data.
    fetch ({ store, params }) {
      return store.dispatch('api/get', {
        endpoint: '/api/index',
        callback: (res) => {
          // Write the data to the index store.
          store.dispatch('index', res.data)

          // Commit the index layer.
          store.commit('layers/add', { type: 'index' })
        }})
    }
  }
</script>
