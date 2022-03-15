<template>
  <div class="my-8">
    <div v-if="description" class="container mx-auto px-4 my-2">
      <div class="prose" v-html="description" />
    </div>
    <div class="mockup-code mx-4">
      <pre
        v-if="filename"
        class="mb-4"
        data-prefix="#"
      ><code v-text="filename" /></pre>

      <pre
        v-for="(line, lineNumber) of code"
        :key="lineNumber"
        :data-prefix="lineNumber"
      ><!--
        --><code v-text="line" /><!--
      --></pre>
    </div>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin],

  computed: {
    code: ({ entity }) => entity.attributes.field_code.split('\n'),
    description: ({ entity }) => entity.attributes.field_description.processed,
    filename: ({ entity }) => entity.attributes.field_title,
  },
}
</script>
