<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'
import { formatArticleDate } from '~/utils/format'
import { canonicalUrlForPath } from '~/utils/socialMeta'

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
  // Bare title — app.vue's global titleTemplate appends "· stuar.tc" for
  // the <title> tag. og:title/twitter:title below are untouched by that
  // template (it only wraps the <title> element), so they keep their own
  // explicit suffix.
  title: () => article.value?.title,
  description: () => article.value?.description,
  ogType: 'article',
  ogUrl: () => canonicalUrlForPath(route.path),
  ogTitle: () => `${article.value?.title} · stuar.tc`,
  ogDescription: () => article.value?.description,
  twitterTitle: () => `${article.value?.title} · stuar.tc`,
  twitterDescription: () => article.value?.description,
})

// BlogPosting entry for this article, referencing the site-wide WebSite/
// Person nodes from app.vue's @graph by @id rather than duplicating them —
// the only per-article structured data the site previously emitted was the
// generic WebSite/Person graph, with nothing identifying individual posts
// as articles.
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${canonicalUrlForPath(route.path)}#article`,
        mainEntityOfPage: canonicalUrlForPath(route.path),
        url: canonicalUrlForPath(route.path),
        headline: article.value?.title,
        description: article.value?.description,
        datePublished: article.value?.date,
        author: { '@id': 'https://stuar.tc/#person' },
        publisher: { '@id': 'https://stuar.tc/#website' },
      }),
    },
  ],
})

// Overrides app.vue's site-wide OG image with the article's own title, so
// the generated share image is post-specific rather than the generic
// "Writing" section fallback. Only read by nuxt-og-image's SSR
// image-generation pass — see the equivalent note in app.vue.
defineOgImage('StuartcOgImage', {
  title: computed(() => article.value!.title),
  value: useShareUrl({ forQr: true }),
  eyebrow: 'writing',
})

// Nuxt Content's JSON-schema-based typegen can't express the self-referential
// `section` paragraph's nested regions, so it falls back to `unknown[]` for
// them — the runtime shape still matches nuxt/content.config.ts's zod schema
// (which sync-content.mjs's output is validated against at build time).
const paragraphs = computed(() => article.value!.paragraphs as Paragraph[])
</script>

<template>
  <article v-if="article" class="mx-auto max-w-6xl px-6 py-16 sm:px-10">
    <UButton
      to="/writing"
      variant="link"
      color="primary"
      label="← all posts"
      class="mb-5.5 -ml-3 font-mono text-[13px] font-semibold"
    />
    <div class="font-mono text-xs text-muted">
      {{ formatArticleDate(article.date) }} · {{ article.readingTime }}
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
