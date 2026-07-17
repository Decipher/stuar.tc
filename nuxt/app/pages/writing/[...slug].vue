<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const route = useRoute()

const { data: article } = await useAsyncData(`article-${route.path}`, () =>
  queryCollection('articleEntries')
    .path(route.path)
    .first(),
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

useSeoMeta({
  title: () => `${article.value?.title} · stuar.tc`,
  description: () => article.value?.description,
})

// Nuxt Content's JSON-schema-based typegen can't express the self-referential
// `section` paragraph's nested regions, so it falls back to `unknown[]` for
// them — the runtime shape still matches nuxt/content.config.ts's zod schema
// (which sync-content.mjs's output is validated against at build time).
const paragraphs = computed(() => (article.value?.paragraphs ?? []) as Paragraph[])
</script>

<template>
  <article v-if="article" class="mx-auto max-w-3xl px-6 py-16 sm:px-10">
    <UButton
      to="/writing"
      variant="link"
      color="primary"
      label="← all posts"
      class="mb-8 -ml-3"
    />
    <h1 class="text-4xl font-bold leading-tight tracking-tight text-highlighted sm:text-5xl">
      {{ article.title }}
    </h1>
    <div class="mt-4 font-mono text-[13px] font-medium text-dimmed">
      {{ article.date.replace(/-/g, '.') }} · {{ article.readingTime }}
    </div>
    <div class="mt-10 space-y-6">
      <AppDruxtParagraph v-for="(paragraph, index) in paragraphs" :key="index" :paragraph="paragraph" />
    </div>
  </article>
</template>
