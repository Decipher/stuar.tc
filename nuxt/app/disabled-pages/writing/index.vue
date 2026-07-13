<script setup lang="ts">
useSeoMeta({
  title: 'Writing · stuar.tc',
  description: 'Articles on Drupal, Nuxt, and decoupled architecture.',
})

const { data: articles } = await useAsyncData('writing-articles', () =>
  queryCollection('articles')
    .order('date', 'DESC')
    .all(),
)

function formatDate(date: string): string {
  return date.replace(/-/g, '.')
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-16 sm:px-10">
    <h1 class="text-4xl font-bold tracking-tighter text-highlighted sm:text-5xl">
      Writing
    </h1>
    <div class="mt-8">
      <SCArticleRow
        v-for="article in articles"
        :key="article.path"
        :date="formatDate(article.date)"
        :title="article.title"
        :excerpt="article.description"
        :reading-time="article.read"
        :category="article.tags?.[0]"
        :to="article.path"
      />
    </div>
  </div>
</template>
