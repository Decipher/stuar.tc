<template>
  <div class="container mx-auto my-32">
    <div class="prose">
      <h2 v-text="entity.attributes.field_title" />
    </div>

    <slot name="top" />
    <div class="md:flex">
      <slot class="md:flex-grow" name="first" />
      <slot class="md:flex-grow" name="second" />
    </div>
    <slot name="bottom" />
  </div>
</template>

<script>
import { DruxtLayoutParagraphMixin } from 'druxt-layout-paragraphs'
export default {
  mixins: [DruxtLayoutParagraphMixin],
}
</script>
