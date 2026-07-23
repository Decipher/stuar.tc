<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'link' }> }>()

const isExternal = computed(() => /^https?:\/\//.test(props.paragraph.link.href))
</script>

<template>
  <UButton
    :to="paragraph.link.href"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener' : undefined"
    :label="`${paragraph.link.label} ${isExternal ? '↗' : '→'}`"
    color="neutral"
    variant="outline"
    :class="isExternal ? 'text-muted hover:border-inverted' : 'border-inverted text-highlighted hover:bg-inverted hover:text-inverted'"
  />
</template>
