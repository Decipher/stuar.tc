<template>
  <a-entity id="controls" position="-22 15 -20">

    <!-- Back button -->
    <scvr-button
      v-if="$route.name !== 'index'"

      @click="back()"

      width="50">< Home</scvr-button>

  </a-entity>
</template>

<script>
  export default {
    methods: {
      back () {
        this.$router.push('/')
      }
    }
  }
</script>
