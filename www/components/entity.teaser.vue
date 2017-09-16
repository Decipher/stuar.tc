<template>
  <a-entity
    @click="click"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"

    :position="position">
    <a-image
      :src="`#img-${entity.uuid}`"

      height="9"
      width="16"
    ></a-image>

    <!-- Focused -->
    <a-entity
      v-if="focused"

      position="0 0 0.025">
      <a-plane
        material="side: double; color: #000; transparent: true; opacity: 0.75"
        height="9"
        width="16"
      ></a-plane>
      <a-text
        :value="delta"

        align="center"
        color="white"
        font="fonts/Roboto-msdf.json"
        position="0 0 0.05"
        width="16"
      ></a-text>
    </a-entity>
  </a-entity>
</template>

<script>
  export default {
    data () {
      return {
        focused: false
      }
    },

    methods: {
      click () {
        if (this.disabled) { return }
        this.$store.commit('layers/add', { type: 'entity', data: this.entity })
      },

      mouseenter () {
        if (this.disabled) { return }
        this.focused = true
      },

      mouseleave () {
        if (this.disabled) { return }
        this.focused = false
      }
    },

    props: ['delta', 'disabled', 'entity', 'position']
  }
</script>
