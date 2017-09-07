<template>
  <a-entity
    :position="position">
    <a-image
      :src="`#img-${entity.uuid}`"

      height="9"
      width="16"
    ></a-image>
  </a-entity>
</template>

<script>
  export default {
    props: ['entity', 'position']
  }
</script>
