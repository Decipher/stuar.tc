<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'code' }> }>()
</script>

<template>
  <!--
    `highlighted` is Prism's token markup, written into the article by
    scripts/highlight-code.mjs and stored beside the code, so nothing
    highlights at runtime and no highlighter reaches the browser. Absent for
    `text` and for a block with no language, which then renders verbatim and
    inherits the block's own colour.
  -->
  <SCCodeBlock :filename="paragraph.title" :copy="paragraph.code">
    <code
      v-if="paragraph.highlighted"
      :class="`language-${paragraph.language}`"
      v-html="paragraph.highlighted"
    />
    <template v-else>{{ paragraph.code }}</template>
  </SCCodeBlock>
</template>
