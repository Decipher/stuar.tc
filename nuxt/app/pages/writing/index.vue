<script setup lang="ts">
import { formatArticleDate } from '~/utils/format'

useSeoMeta({
  title: 'Writing · stuar.tc',
  description: 'Articles on Drupal, Nuxt, and decoupled architecture.',
})

const { data: articles } = await useAsyncData('writing-articles', () =>
  queryCollection('articleEntries')
    .order('date', 'DESC')
    .all(),
)
</script>

<template>
  <div class="bg-muted">
    <SCPageHero title="Writing">
      <template #eyebrow>// writing · {{ articles?.length ?? 0 }} posts</template>
      <template #description>
        Notes on Druxt, decoupled Drupal, and whatever else comes up building this stuff for a living.
      </template>
      <template #actions>
        <UButton
          to="/blog.xml"
          external
          icon="i-lucide:rss"
          label="RSS"
          variant="link"
          color="neutral"
          size="sm"
          class="-ml-3 mt-7 font-mono"
        />
      </template>
    </SCPageHero>
    <div class="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
      <div class="flex flex-col">
        <SCArticleRow
          v-for="article in articles"
          :key="article.path"
          :date="formatArticleDate(article.date)"
          :title="article.title"
          :reading-time="article.readingTime"
          :tags="article.categories"
          :to="article.path"
        />
      </div>
    </div>
  </div>
</template>
