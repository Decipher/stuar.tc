<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'media' }> }>()
</script>

<template>
  <figure class="my-2">
    <img
      :src="paragraph.src"
      :alt="paragraph.alt"
      :width="paragraph.width"
      :height="paragraph.height"
      loading="lazy"
      class="w-full rounded-md border border-default"
    >
    <!-- eslint-disable-next-line vue/no-v-html -->
    <figcaption v-if="paragraph.caption" class="mt-2 text-center text-sm text-muted" v-html="paragraph.caption" />
  </figure>
</template>
