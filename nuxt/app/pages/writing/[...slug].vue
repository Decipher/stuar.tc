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
      class="mb-5.5 -ml-3 font-mono text-[13px] font-semibold"
    />
    <div class="font-mono text-xs text-muted">
      {{ article.date.replace(/-/g, '.') }} · {{ article.readingTime }}
    </div>
    <h1 class="mt-3.5 text-4xl font-extrabold leading-[1.06] tracking-[-0.03em] text-highlighted sm:text-5xl">
      {{ article.title }}
    </h1>
    <div v-if="article.categories.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="category in article.categories"
        :key="category"
        class="rounded-full border border-default px-2.75 py-1 font-mono text-[11.5px] text-muted"
      >
        {{ category }}
      </span>
    </div>

    <div class="mt-10 flex flex-col gap-[clamp(28px,3.5vw,40px)]">
      <AppDruxtParagraph v-for="(paragraph, index) in paragraphs" :key="index" :paragraph="paragraph" />
    </div>

    <AppGiscusComments :path="article.path" />
  </article>
</template>
