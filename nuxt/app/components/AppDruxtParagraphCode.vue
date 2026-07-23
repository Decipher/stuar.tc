<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Extract<Paragraph, { type: 'code' }> }>()
</script>

<template>
  <SCCodeBlock :filename="paragraph.title">{{ paragraph.code }}</SCCodeBlock>
</template>
