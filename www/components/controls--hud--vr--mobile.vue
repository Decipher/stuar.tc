<template>
  <a-entity id="controls">

    <!-- Back button - top -->
    <scvr-button
      v-if="$route.name !== 'index'"

      @click="back()"

      position="0 50 -15"
      rotation="45 0 0"
      type="round"
      width="50">&lt; Back</scvr-button>

    <!-- Back button - bottom -->
    <scvr-button
      v-if="$route.name !== 'index'"

      @click="back()"

      position="0 -50 -15"
      rotation="-45 0 0"
      type="round"
      width="50">&lt; Back</scvr-button>

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
