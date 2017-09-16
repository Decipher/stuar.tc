<template>
  <a-assets>
    <img
      v-for="{uuid, src} in assets.img"

      :id="`img-${uuid}`"
      :key="uuid"
      :src="src" />
  </a-assets>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      assets: state => state.assets
    })
  }
}
</script>
