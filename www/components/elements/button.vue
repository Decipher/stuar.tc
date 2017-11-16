<template>
  <a-entity
    @click="$emit('click')"

    :geometry="geometry"
    :text="`align: center; color: #FFF; font: /fonts/Roboto-msdf.json; value: ${$slots.default[0].text}; width: ${width};`"

    material="color: #000" />
</template>

<script>
export default {
  computed: {
    geometry () {
      switch (this.type) {
        case 'round':
          return `primitive: circle; radius: ${this.width / 8}`

        default:
          return `height: 2; primitive: plane; width: ${this.width / 4}`
      }
    }
  },

  props: {
    type: {
      default: 'box'
    },
    width: {}
  }
}
</script>
