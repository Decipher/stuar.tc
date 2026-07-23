<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'card_group' }> }>()
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
    <AppDruxtParagraphCard v-for="(card, index) in paragraph.cards" :key="index" :paragraph="card" />
  </div>
</template>
