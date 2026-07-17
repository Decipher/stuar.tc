<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'text_formatted' }> }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="prose prose-lg max-w-none dark:prose-invert" v-html="paragraph.html" />
</template>
