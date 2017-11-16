<template>
  <a-text
    :align="align"
    :color="color"
    :font="font"
    :value="$slots.default[0].text"
    :width="width" />
</template>

<script>
export default {
  props: {
    align: {
      default: 'left'
    },
    color: {
      default: 'black'
    },
    font: {
      default: '/fonts/Roboto-msdf.json'
    },
    value: {},
    width: {}
  }
}
</script>

<style scoped>

</style>
