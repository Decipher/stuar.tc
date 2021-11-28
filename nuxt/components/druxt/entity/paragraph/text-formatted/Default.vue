<template>
  <div class="container mx-auto px-4 py-2">
    <div class="prose">
      <slot />
    </div>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],
}
</script>
