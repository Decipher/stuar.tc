<template>
  <a-entity
    @click="click"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"

    :rotation="rotation">
    <a-entity :position="position">

      <!-- Thumbnail -->
      <a-image
        :src="`#img--${entity.image.id}--thumbnail`"

        height="10"
        width="20" />

      <!-- Frame -->
      <a-plane
        height="10.5"
        material="side: double; color: #000;"
        position="0 0 -0.05"
        width="20.5" />

      <!-- Focused -->
      <a-entity v-if="focused" position="0 0 0.025">

        <!-- Overlay -->
        <a-plane
          material="side: double; color: #000; transparent: true; opacity: 0.5"
          height="10"
          width="20" />

        <!-- Title -->
        <scvr-text
          align="center"
          color="white"
          position="0 0 0.05"
          width="16"
          wrap-count="16"
        >{{ entity.title }}</scvr-text>

      </a-entity>

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

        this.entity.delta = this.delta
        this.$router.push({ name: 'photo-id', params: { id: this.entity.id, entity: this.entity } })
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

    props: [
      'delta',
      'disabled',
      'entity',
      'position',
      'rotation'
    ]
  }
</script>
