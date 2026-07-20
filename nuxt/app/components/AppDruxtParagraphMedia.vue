<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'media' }> }>()
</script>

<template>
  <SCImageLightbox
    :src="paragraph.src"
    :alt="paragraph.alt"
    :width="paragraph.width"
    :height="paragraph.height"
    :caption="paragraph.caption"
  />
</template>
