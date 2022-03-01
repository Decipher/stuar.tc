<template>
  <div class="mockup-code mx-4 my-8">
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
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin],

  computed: {
    code: ({ entity }) => entity.attributes.field_code.split('\n'),
    filename: ({ entity }) => entity.attributes.field_title,
  },
}
</script>
