<template>
  <a-assets>
    <img
      v-for="{uuid, src, modifier} in assets.img"

      :id="`img--${uuid}${modifier ? '--' + modifier : ''}`"
      :key="uuid"
      :src="src"

      crossorigin="anonymous" />
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
