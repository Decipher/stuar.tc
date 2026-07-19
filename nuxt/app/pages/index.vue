<script setup lang="ts">
import { projects } from '~/data/projects'
import { site } from '~/data/site'

const { ffpSites } = useStats()

const { data: latestArticles } = await useAsyncData('homepage-latest-articles', () =>
  queryCollection('articleEntries').order('date', 'DESC').limit(4).all(),
)
const featuredArticle = computed(() => latestArticles.value?.[0])
const compactArticles = computed(() => latestArticles.value?.slice(1) ?? [])
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-6 pb-12 pt-20 sm:px-10">
      <SCEyebrow>// Hello world.</SCEyebrow>
      <h1 class="mt-7 text-5xl font-bold tracking-tighter text-highlighted sm:text-7xl sm:tracking-[-0.045em] lg:text-[108px] lg:leading-[0.9]">
        Stuart Clark
      </h1>
      <p class="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-2xl">
        Senior Drupal &amp; JavaScript engineer in Ballarat, Australia. Creator of
        <strong class="font-semibold text-highlighted">DruxtJS</strong>. Decoupled
        Drupal, done properly.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <SCStatusPill available :label="site.status" />
        <UButton color="primary" label="View open source" trailing-icon="i-lucide-arrow-right" to="/open-source" />
        <UButton color="neutral" variant="outline" label="About" to="/about" />
      </div>
    </section>

    <!-- From the blog -->
    <section v-if="featuredArticle" class="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
      <SCSectionHeader title="From the blog" action="all posts →" to="/writing" />
      <div class="mt-5.5">
        <SCArticleCard
          :date="featuredArticle.date.replace(/-/g, '.')"
          :title="featuredArticle.title"
          :excerpt="featuredArticle.description"
          :reading-time="featuredArticle.readingTime"
          :tags="featuredArticle.categories"
          :to="featuredArticle.path"
        />
      </div>
      <div class="mt-3.5 grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        <SCArticleCard
          v-for="article in compactArticles"
          :key="article.path"
          compact
          :date="article.date.replace(/-/g, '.')"
          :title="article.title"
          :reading-time="article.readingTime"
          :tags="article.categories"
          :to="article.path"
        />
      </div>
    </section>

    <!-- Stats -->
    <AppStatBand />

    <!-- Heartbeat -->
    <section class="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <div class="flex items-end justify-between gap-6">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-highlighted">
            Heartbeat
          </h2>
          <div class="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-dimmed">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span class="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            live · recent commits &amp; releases
          </div>
        </div>
        <NuxtLink to="/open-source" class="shrink-0 font-mono text-[13px] font-medium text-primary">
          all activity →
        </NuxtLink>
      </div>
      <AppActivityFeed class="mt-7" :limit="5" />
    </section>

    <!-- Selected work -->
    <section class="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
      <SCSectionHeader title="Selected work" action="all projects →" to="/open-source" />
      <div class="mt-7 grid gap-4 md:grid-cols-3">
        <SCProjectCard
          v-for="p in projects"
          :key="p.name"
          :tag="p.tag"
          :name="p.name"
          :description="p.description"
          :meta="p.name === 'File (Field) Paths' ? `${ffpSites} sites` : p.meta"
          :href="p.href"
        />
      </div>
    </section>

    <!-- Photography teaser -->
    <!-- photos section disabled for first launch
    <section class="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-16 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <SCEyebrow>// off the clock</SCEyebrow>
        <h2 class="mt-3 text-2xl font-bold tracking-tight text-highlighted">
          Photography &amp; drone work
        </h2>
        <p class="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
          A quiet corner of the site. Chronological, no captions.
        </p>
        <UButton color="neutral" variant="link" label="View photos →" to="/photos" class="mt-3 -ml-3" />
      </div>
      <SCGallery
        :items="[
          { src: 'https://picsum.photos/seed/stuart-photo-1/400/400', alt: 'Photograph 1' },
          { src: 'https://picsum.photos/seed/stuart-photo-2/400/400', alt: 'Photograph 2' },
          { src: 'https://picsum.photos/seed/stuart-photo-3/400/400', alt: 'Photograph 3' },
          { src: 'https://picsum.photos/seed/stuart-photo-4/400/400', alt: 'Photograph 4' },
        ]"
      />
    </section>
    -->
  </div>
</template>
