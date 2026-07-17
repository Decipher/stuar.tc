<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'repository' }> }>()

const gitpodUrl = computed(() => `https://gitpod.io/#${props.paragraph.url}`)
</script>

<template>
  <div class="overflow-hidden rounded-md border border-default bg-elevated p-5">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prose prose-lg max-w-none dark:prose-invert" v-html="paragraph.description" />
    <div class="mt-4 flex flex-wrap gap-3">
      <UButton
        :to="paragraph.url"
        target="_blank"
        rel="noopener"
        icon="i-lucide-github"
        label="View source"
        color="neutral"
        variant="outline"
      />
      <UButton
        v-if="paragraph.gitpod"
        :to="gitpodUrl"
        target="_blank"
        rel="noopener"
        icon="i-lucide-external-link"
        label="Open in Gitpod"
        color="neutral"
        variant="outline"
      />
    </div>
  </div>
</template>
