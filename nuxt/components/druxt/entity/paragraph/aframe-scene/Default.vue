<template>
  <div class="my-8">
    <ClientOnly>
      <!-- eslint-disable vue/no-v-html -->
      <a-scene class="container h-96 mx-auto" embedded v-html="scene" />
      <!-- eslint-enable vue/no-v-html -->
    </ClientOnly>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

// Import A-Frame library client-side only.
if (process.client) {
  require('aframe')
}

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    scene: ({ entity }) => entity.attributes.field_scene,
  },
}
</script>
