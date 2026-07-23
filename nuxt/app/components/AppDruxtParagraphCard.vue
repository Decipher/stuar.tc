<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'card' }> }>()

const isExternal = computed(() => /^https?:\/\//.test(props.paragraph.link?.href ?? ''))
</script>

<template>
  <component
    :is="paragraph.link ? 'NuxtLink' : 'div'"
    :to="paragraph.link?.href"
    :target="paragraph.link && isExternal ? '_blank' : undefined"
    :rel="paragraph.link && isExternal ? 'noopener' : undefined"
    class="block overflow-hidden rounded-lg border border-default bg-default text-inherit no-underline transition-colors hover:border-primary"
  >
    <img
      v-if="paragraph.image"
      :src="paragraph.image.src"
      :alt="paragraph.image.alt"
      :width="paragraph.image.width"
      :height="paragraph.image.height"
      class="aspect-[16/10] w-full object-cover"
    >
    <div :class="paragraph.image ? 'px-5 py-4.5' : 'p-5'">
      <!-- Stands in for a missing image so the card doesn't read as broken. -->
      <span v-if="!paragraph.image" class="mb-3.5 block size-2.5 bg-primary" />
      <h4 v-if="paragraph.title" class="text-[17px] font-bold leading-[1.25] tracking-[-0.01em] text-highlighted">
        {{ paragraph.title }}
      </h4>
      <p class="mt-2 text-sm leading-[1.5] text-default">{{ paragraph.description }}</p>
      <div v-if="paragraph.link" class="mt-3.5 flex items-center gap-1.5 font-mono text-xs font-semibold text-primary">
        <span>{{ paragraph.link.label }}</span>
        <span>{{ isExternal ? '↗' : '→' }}</span>
      </div>
    </div>
  </component>
</template>
