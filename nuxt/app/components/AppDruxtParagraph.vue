<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

defineProps<{ paragraph: Paragraph }>()

function assertNever(value: never): never {
  throw new Error(`AppDruxtParagraph: no renderer for paragraph ${JSON.stringify(value)}`)
}
</script>

<template>
  <AppDruxtParagraphTextFormatted v-if="paragraph.type === 'text_formatted'" :paragraph="paragraph" />
  <AppDruxtParagraphCode v-else-if="paragraph.type === 'code'" :paragraph="paragraph" />
  <AppDruxtParagraphRepository v-else-if="paragraph.type === 'repository'" :paragraph="paragraph" />
  <AppDruxtParagraphMedia v-else-if="paragraph.type === 'media'" :paragraph="paragraph" />
  <AppDruxtParagraphSection v-else-if="paragraph.type === 'section'" :paragraph="paragraph" />
  <template v-else>{{ assertNever(paragraph) }}</template>
</template>
