<template>
  <a-entity
    :id="'layer-' + delta"
    :position="`-${delta * delta * 66} ${delta * delta * 66} -${delta * delta * 100 + 25}`">
    <component
      :data="data"
      :delta="delta"
      :is="type"
    ></component>
  </a-entity>
</template>

<script>
  export default {
    props: ['data', 'delta', 'type']
  }
</script>
