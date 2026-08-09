<script setup lang="ts">
import { UButton } from '#components'
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

interface Post {
  path: string
  date: string
  title: string
  tags: string[]
  readingTime: string
}

const posts = computed<Post[]>(() => (articles.value ?? []).map(article => ({
  path: article.path,
  date: article.date,
  title: article.title,
  tags: article.categories,
  readingTime: article.readingTime,
})))

const search = ref('')
const activeTags = ref<string[]>([])
// TanStack sorting state — UTable reads/writes this directly via v-model:sorting.
const sorting = ref([{ id: 'date', desc: true }])
const allTags = computed(() => [...new Set(posts.value.flatMap(p => p.tags))])

function toggleTag(tag: string) {
  activeTags.value = activeTags.value.includes(tag)
    ? activeTags.value.filter(t => t !== tag)
    : [...activeTags.value, tag]
}

const filtered = computed(() => posts.value.filter((p) => {
  const q = search.value.trim().toLowerCase()
  const matchesSearch = !q || p.title.toLowerCase().includes(q)
  const matchesTags = !activeTags.value.length || p.tags.some(t => activeTags.value.includes(t))
  return matchesSearch && matchesTags
}))

// Mobile card list has no table/TanStack sorting, so sort it the same way
// manually. `date` is the full ISO timestamp (see content.schema.ts), so
// same-day posts still compare correctly by time, not just calendar date.
// `sorting` always has exactly one entry: initialized with one below, and
// the header button only ever calls `toggleSorting(desc: boolean)` with an
// explicit direction (never omitted), which sets rather than removes it.
const filteredSorted = computed(() => [...filtered.value].sort((a, b) =>
  sorting.value[0]!.desc === false ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))

// Minimal shape of the TanStack `column` header-slot arg actually used here
// — narrower than pulling in `@tanstack/vue-table` (a transient dep of
// @nuxt/ui, not resolvable as a direct import under this app's pnpm layout)
// just for one callback's types.
interface SortableColumn {
  getIsSorted: () => false | 'asc' | 'desc'
  toggleSorting: (desc?: boolean) => void
}

// Nuxt UI v3 UTable (TanStack-backed) column defs.
const columns = [
  {
    accessorKey: 'date',
    // The date column is initialized sorted (see `sorting` above) and
    // `onClick` always passes an explicit direction to `toggleSorting`, so
    // it only ever toggles between 'asc'/'desc' — never reaches an
    // unsorted state, hence the two-way (not three-way) icon ternary.
    header: ({ column }: { column: SortableColumn }) => h(UButton, {
      label: 'Date',
      color: 'neutral',
      variant: 'ghost',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    }),
    enableSorting: true,
  },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'tags', header: 'Tags', enableSorting: false },
  { accessorKey: 'readingTime', header: 'Read', enableSorting: false },
]
</script>

<template>
  <div class="bg-muted">
    <SCPageHero title="Writing">
      <template #eyebrow>// writing · {{ filtered.length }} of {{ posts.length }} posts</template>
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

    <div class="mx-auto max-w-6xl space-y-6 px-6 pb-16 sm:px-10">
      <div class="flex flex-col gap-3">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search posts…" class="w-full sm:max-w-xs" />
        <div v-if="allTags.length" class="flex flex-wrap gap-2">
          <UButton
            v-for="tag in allTags"
            :key="tag"
            :label="tag"
            size="xs"
            :color="activeTags.includes(tag) ? 'primary' : 'neutral'"
            :variant="activeTags.includes(tag) ? 'solid' : 'outline'"
            @click="toggleTag(tag)"
          />
        </div>
      </div>

      <!-- desktop / tablet: data table -->
      <UTable v-model:sorting="sorting" :data="filtered" :columns="columns" class="hidden sm:block">
        <template #date-cell="{ row }">
          <span class="font-mono text-[13px] text-dimmed">{{ formatArticleDate(row.original.date) }}</span>
        </template>
        <template #title-cell="{ row }">
          <NuxtLink :to="row.original.path" class="font-semibold text-highlighted hover:text-primary">
            {{ row.original.title }}
          </NuxtLink>
        </template>
        <template #tags-cell="{ row }">
          <div class="flex flex-wrap gap-1.5">
            <UBadge v-for="t in row.original.tags" :key="t" color="neutral" variant="subtle" size="sm" :label="t" />
          </div>
        </template>
        <template #readingTime-cell="{ row }">
          <span class="font-mono text-xs text-dimmed">{{ row.original.readingTime }}</span>
        </template>
      </UTable>

      <!-- mobile: stacked cards, same data -->
      <div class="space-y-3 sm:hidden">
        <NuxtLink
          v-for="p in filteredSorted"
          :key="p.path"
          :to="p.path"
          class="block rounded-md border border-default bg-default p-4"
        >
          <div class="mb-1.5 font-mono text-xs text-dimmed">{{ formatArticleDate(p.date) }} · {{ p.readingTime }}</div>
          <h3 class="mb-1 font-semibold text-highlighted">{{ p.title }}</h3>
          <div class="flex flex-wrap gap-1.5">
            <UBadge v-for="t in p.tags" :key="t" color="neutral" variant="subtle" size="sm" :label="t" />
          </div>
        </NuxtLink>
      </div>

      <p v-if="!filtered.length" class="py-16 text-center text-muted">
        No posts match &ldquo;{{ search }}&rdquo;.
      </p>
    </div>
  </div>
</template>
