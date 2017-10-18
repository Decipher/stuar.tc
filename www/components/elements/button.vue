<template>
  <a-entity
    @click="$emit('click')"

    :geometry="`height: 2; primitive: plane; width: ${width / 4}`"
    :text="`align: center; color: #FFF; font: fonts/Roboto-msdf.json; value: ${value}; width: ${width};`"

    material="color: #000" />
</template>

<script>
export default {
  props: {
    value: {},
    width: {}
  }
}
</script>

<style scoped>

</style>
