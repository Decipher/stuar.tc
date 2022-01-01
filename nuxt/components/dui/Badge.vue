<template>
  <div :class="classes"><slot /></div>
</template>

<script>
export default {
  props: {
    size: {
      type: String,
      default: undefined,
    },
    type: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    classes: ({ size, type }) =>
      ['badge', type && `badge-${type}`, size && `badge-${size}`].filter(
        (o) => o
      ),
  },
}
</script>
