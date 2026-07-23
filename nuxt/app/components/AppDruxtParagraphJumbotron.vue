<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'jumbotron' }> }>()
</script>

<template>
  <div class="rounded-[10px] border border-default bg-primary/8 p-[clamp(24px,3vw,34px)]">
    <span class="mb-3 block font-mono text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary">Worth calling out</span>
    <h4 v-if="paragraph.title" class="mb-3 text-[21px] font-bold leading-[1.25] tracking-[-0.02em] text-highlighted">
      {{ paragraph.title }}
    </h4>
    <div class="space-y-4">
      <AppDruxtParagraph v-for="(child, index) in paragraph.content" :key="index" :paragraph="child" />
    </div>
  </div>
</template>
