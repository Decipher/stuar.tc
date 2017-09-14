<template>
  <a-assets>
    <img
      v-for="(src, uuid) in $store.state.assets.img"

      :id="`img-${uuid}`"
      :key="uuid"
      :src="src" />
  </a-assets>
</template>

<script>
export default {}
</script>
