<template>
  <a-entity
    :id="'layer-' + delta">
    <component
      :data="data"
      :delta="delta"
      :is='layer'
    ></component>
  </a-entity>
</template>

<script>
  export default {
    computed: {
      // Prefix layer component identifier.
      layer () {
        return `scvr-layer-${this.type}`
      }
    },

    props: ['data', 'delta', 'type']
  }
</script>
