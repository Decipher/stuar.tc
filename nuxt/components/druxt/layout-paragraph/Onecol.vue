<template>
  <div class="my-32">
    <div class="container mx-auto">
      <div class="prose">
        <h2 v-text="entity.attributes.field_title" />
      </div>
    </div>

    <slot name="content" />
  </div>
</template>

<script>
import { DruxtLayoutParagraphMixin } from 'druxt-layout-paragraphs'
export default {
  mixins: [DruxtLayoutParagraphMixin],
}
</script>
