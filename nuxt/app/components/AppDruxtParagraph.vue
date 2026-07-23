<script setup lang="ts">
import type { Component } from 'vue'
import type { Paragraph } from '~/utils/druxtParagraph'
import AppDruxtParagraphCard from './AppDruxtParagraphCard.vue'
import AppDruxtParagraphCardGroup from './AppDruxtParagraphCardGroup.vue'
import AppDruxtParagraphCode from './AppDruxtParagraphCode.vue'
import AppDruxtParagraphJumbotron from './AppDruxtParagraphJumbotron.vue'
import AppDruxtParagraphLink from './AppDruxtParagraphLink.vue'
import AppDruxtParagraphMedia from './AppDruxtParagraphMedia.vue'
import AppDruxtParagraphRepository from './AppDruxtParagraphRepository.vue'
import AppDruxtParagraphSection from './AppDruxtParagraphSection.vue'
import AppDruxtParagraphTextFormatted from './AppDruxtParagraphTextFormatted.vue'

defineProps<{ paragraph: Paragraph }>()

// Modeled on Druxt's DruxtModule component resolution (DruxtEntity et al
// pick a renderer by building a component name from the resource's bundle
// and resolving it against Nuxt's component registry, falling back to a
// debug placeholder rather than crashing). We have one naming axis, not
// Druxt's ResourceType/ViewMode/SchemaType chain, so a single lookup table
// stands in for the fallback chain — `satisfies` keeps it exhaustive, so
// adding a Paragraph variant without a matching entry fails to compile.
const paragraphComponents: Record<Paragraph['type'], Component> = {
  text_formatted: AppDruxtParagraphTextFormatted,
  code: AppDruxtParagraphCode,
  repository: AppDruxtParagraphRepository,
  media: AppDruxtParagraphMedia,
  section: AppDruxtParagraphSection,
  card: AppDruxtParagraphCard,
  card_group: AppDruxtParagraphCardGroup,
  jumbotron: AppDruxtParagraphJumbotron,
  link: AppDruxtParagraphLink,
}
</script>

<template>
  <component :is="paragraphComponents[paragraph.type]" :paragraph="paragraph" />
</template>
