<template>
  <a-entity
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
        color="black"
        height="9"
        width="16"
      ></a-plane>
      <a-text
        :value="entity.title"

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
      mouseenter () {
        this.focused = true
      },

      mouseleave () {
        this.focused = false
      }
    },

    props: ['entity', 'position']
  }
</script>
