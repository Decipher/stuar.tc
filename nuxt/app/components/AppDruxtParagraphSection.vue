<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'section' }> }>()

const regionEntries = computed(() => Object.entries(props.paragraph.regions))

// Only Layout Paragraphs' two-column layout gets a side-by-side render —
// other region names (content/top/bottom, seen on other layout plugins)
// stack in their original order rather than guessing at Drupal's full
// layout-plugin catalog.
const isTwoColumn = computed(() =>
  regionEntries.value.length === 2
  && regionEntries.value.every(([region]) => region === 'first' || region === 'second'),
)
const flattened = computed(() => regionEntries.value.flatMap(([, children]) => children))
</script>

<template>
  <section class="my-8">
    <h2 v-if="paragraph.title" class="text-2xl font-bold tracking-tight text-highlighted">
      {{ paragraph.title }}
    </h2>
    <div v-if="isTwoColumn" class="mt-4 grid gap-6 md:grid-cols-2">
      <div v-for="[region, children] in regionEntries" :key="region" class="space-y-6">
        <AppDruxtParagraph v-for="(child, index) in children" :key="index" :paragraph="child" />
      </div>
    </div>
    <div v-else class="mt-4 space-y-6">
      <AppDruxtParagraph v-for="(child, index) in flattened" :key="index" :paragraph="child" />
    </div>
  </section>
</template>
