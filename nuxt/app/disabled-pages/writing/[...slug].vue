<script setup lang="ts">
const route = useRoute()

const { data: article } = await useAsyncData(`article-${route.path}`, () =>
  queryCollection('articles')
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
      {{ article.date.replace(/-/g, '.') }} · {{ article.read }}
    </div>
    <div class="prose prose-lg mt-10 max-w-none dark:prose-invert">
      <ContentRenderer :value="article" />
    </div>
  </article>
</template>
