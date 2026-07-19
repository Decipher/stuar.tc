<script setup lang="ts">
useSeoMeta({
  title: 'Writing · stuar.tc',
  description: 'Articles on Drupal, Nuxt, and decoupled architecture.',
})

const { data: articles } = await useAsyncData('writing-articles', () =>
  queryCollection('articleEntries')
    .order('date', 'DESC')
    .all(),
)

function formatDate(date: string): string {
  return date.replace(/-/g, '.')
}
</script>

<template>
  <div class="bg-muted">
    <div class="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <SCEyebrow>// writing · {{ articles?.length ?? 0 }} posts</SCEyebrow>
      <h1 class="mt-3.5 text-4xl font-bold tracking-[-0.03em] text-highlighted sm:text-5xl">
        Writing
      </h1>
      <p class="mt-2.5 max-w-lg text-[15.5px] leading-relaxed text-muted">
        Notes on Druxt, decoupled Drupal, and whatever else comes up building this stuff for a living.
      </p>
      <div class="mt-9 flex flex-col">
        <SCArticleRow
          v-for="article in articles"
          :key="article.path"
          :date="formatDate(article.date)"
          :title="article.title"
          :reading-time="article.readingTime"
          :tags="article.categories"
          :to="article.path"
        />
      </div>
    </div>
  </div>
</template>
