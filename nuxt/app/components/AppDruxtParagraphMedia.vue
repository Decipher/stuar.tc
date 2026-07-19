<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'media' }> }>()
</script>

<template>
  <figure>
    <img
      :src="paragraph.src"
      :alt="paragraph.alt"
      :width="paragraph.width"
      :height="paragraph.height"
      loading="lazy"
      class="aspect-[4/3] w-full rounded-lg border border-default object-cover"
    >
    <!-- eslint-disable-next-line vue/no-v-html -->
    <figcaption v-if="paragraph.caption" class="mt-2.5 text-center text-[13.5px] text-muted" v-html="paragraph.caption" />
  </figure>
</template>
