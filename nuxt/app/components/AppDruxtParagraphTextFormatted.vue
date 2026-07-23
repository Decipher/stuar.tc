<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'text_formatted' }> }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    class="prose prose-lg max-w-prose dark:prose-invert prose-p:text-[16.5px] prose-p:leading-[1.7] prose-p:text-default prose-p:mb-4 prose-p:last:mb-0 prose-code:bg-muted prose-code:text-highlighted prose-code:font-medium prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
    v-html="paragraph.html"
  />
</template>
