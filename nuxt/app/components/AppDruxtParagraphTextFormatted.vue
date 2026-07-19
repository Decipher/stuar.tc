<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'text_formatted' }> }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    class="prose prose-lg max-w-none dark:prose-invert prose-p:text-[16.5px] prose-p:leading-[1.7] prose-p:text-default prose-p:mb-4 prose-p:last:mb-0"
    v-html="paragraph.html"
  />
</template>
