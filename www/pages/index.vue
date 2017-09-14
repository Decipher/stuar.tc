<template>
  <a-entity id="index">
    <teaser
      v-for="(entity, uuid, delta) in $store.state.index"

      :entity="entity"
      :key="uuid"
      :position="position(delta)"
    ></teaser>
  </a-entity>
</template>

<script>
  import teaser from '~/components/thing.teaser.vue'

  export default {
    components: {
      teaser
    },

    // Fetch index data.
    fetch ({ store, params }) {
      console.log(store.state)
      return store.dispatch('api/get', {
        endpoint: '/api/index',
        callback: (res) => {
          store.dispatch('index', res.data)
        }})
    },

    methods: {
      position (delta) {
        let row = Math.floor(delta / 3)
        let col = delta % 3

        return `${(col - 1) * (16 + 1)} ${(row - 1) * (9 + 1)} -35`
      }
    }
  }
</script>
