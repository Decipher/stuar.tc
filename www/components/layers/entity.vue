<template>
  <a-entity>
    <a-image
      :src="`#img-${entity.image.id}`"
      :width="entity.image.meta.width * (32 / entity.image.meta.height)"

      height="32"
    ></a-image>
  </a-entity>
</template>

<script>
  export default {
    computed: {
      entity () {
        return this.data
      }
    },

    props: ['data', 'delta']
  }
</script>
