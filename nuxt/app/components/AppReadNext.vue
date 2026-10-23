<script setup lang="ts">
import type { RelatedEntry } from '~/utils/relatedEvents'
import { formatArticleDate } from '~/utils/format'

/**
 * "Read next": three other posts at the end of an article, before comments.
 *
 * The entries come from the article's stored ``related`` list (resolved by
 * ``scripts/sync-content.mjs``); each path is looked up in the content
 * collection here, at build/prerender time, so a card always shows the
 * target's current title, date and excerpt and nothing is fetched from
 * Drupal at runtime. A path that no longer resolves is dropped.
 */
const props = defineProps<{
  /** The current article's path; keys the query. */
  path: string
  /** Related entries, in display order. */
  related: RelatedEntry[]
  /** The current article's topics, to pick each compact card's shared one. */
  topics: string[]
}>()

const { data: targets } = await useAsyncData(`read-next-${props.path}`, () =>
  queryCollection('articleEntries')
    .where('path', 'IN', props.related.map((entry) => entry.path))
    .all(),
)

const cards = computed(() =>
  props.related
    .map((entry) => ({ ...entry, article: targets.value?.find((article) => article.path === entry.path) }))
    .filter((card) => card.article)
    .slice(0, 3)
    .map((card, index) => ({ ...card, article: card.article!, position: index + 1 })),
)
const lead = computed(() => cards.value[0])
// A compact card names only the topic it shares with this post, if any; the
// lead card lists all of its topics.
const rest = computed(() => cards.value.slice(1).map((card) => ({
  ...card,
  sharedTopics: card.article.topics.filter((topic) => props.topics.includes(topic)).slice(0, 1),
})))

const { trackClick } = useRelatedTracking()
</script>

<template>
  <section
    v-if="lead"
    aria-label="Read next"
    class="mt-12 flex flex-col gap-4 border-t border-default pt-8 sm:mt-16 sm:gap-5 sm:pt-10"
  >
    <SCSectionHeader title="Read next" action="All posts" to="/writing" />
    <div class="grid gap-4 sm:gap-5 md:grid-cols-[2fr_1fr]">
      <SCArticleCard
        :date="formatArticleDate(lead.article.date)"
        :title="lead.article.title"
        :excerpt="lead.article.description"
        :reading-time="lead.article.readingTime"
        :tags="lead.article.categories"
        :topics="lead.article.topics"
        :to="lead.path"
        :flag="lead.source === 'picked' ? 'Picked' : ''"
        @click="trackClick(lead.position, lead.source, lead.path)"
      />
      <div v-if="rest.length" class="flex flex-col gap-4 sm:gap-5">
        <SCArticleCard
          v-for="card in rest"
          :key="card.path"
          compact
          class="flex-1"
          :date="formatArticleDate(card.article.date)"
          :title="card.article.title"
          :reading-time="card.article.readingTime"
          :tags="card.article.categories"
          :topics="card.sharedTopics"
          :to="card.path"
          @click="trackClick(card.position, card.source, card.path)"
        />
      </div>
    </div>
  </section>
</template>
