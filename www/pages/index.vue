<template>
  <a-entity id="index">
    <a-image
      v-for="(entity, uuid, delta) in $store.state.index"

      :key="uuid"
      :position="position(delta)"
      :src="`#img-${uuid}`"

      height="9"
      width="16"
    ></a-image>
  </a-entity>
</template>

<script>
  import axios from 'axios'

  export default {
    fetch ({ store, params }) {
      return axios.get('//api.sc.docksal/api/index')
        .then((res) => {
          store.dispatch('index', res.data)
        })
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
