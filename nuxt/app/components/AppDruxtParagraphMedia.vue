<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'media' }> }>()

/**
 * Cap the image at its own intrinsic width.
 *
 * ``SCImageLightbox`` renders at ``w-full``, so a source narrower than the
 * prose column is enlarged to fill it: a 390px-wide phone capture stretches
 * past 700px on desktop, which both softens it and drags its height up with
 * it. A raster has no detail above its intrinsic width, so there is nothing to
 * gain by painting it larger. Wider sources are unaffected — the column is
 * still the smaller of the two, so they keep filling it.
 */
const maxWidth = computed(() =>
  props.paragraph.width ? `${props.paragraph.width}px` : undefined,
)
</script>

<template>
  <div class="mx-auto" :style="maxWidth ? { maxWidth } : undefined">
    <SCImageLightbox
      :src="paragraph.src"
      :alt="paragraph.alt"
      :width="paragraph.width"
      :height="paragraph.height"
      :caption="paragraph.caption"
    />
  </div>
</template>
