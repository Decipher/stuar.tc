<script setup lang="ts">
import { activity as staticActivity } from '~/data/activity'

const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 30 })
const { activity: liveActivity, refreshLive } = useActivity()
const { target } = useLazyRefresh(refreshLive)

// A relative age is only true when it is computed, so the server (and the
// static build) renders each row's absolute `when` ("Oct 23"). Once mounted,
// `now` is set and rows switch to a relative age that re-ticks every minute.
// Switching in onMounted keeps the hydration render identical to the server's.
const now = ref<number | null>(null)
let tick: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  now.value = Date.now()
  tick = setInterval(() => { now.value = Date.now() }, 60_000)
})
onBeforeUnmount(() => clearInterval(tick))

const items = computed(() => {
  const all = liveActivity.value?.length ? liveActivity.value : staticActivity
  return all.slice(0, props.limit).map(a => ({
    ...a,
    when: now.value !== null && a.at ? formatAge(a.at, now.value) : a.when,
  }))
})
</script>

<template>
  <div ref="target">
    <SCAppSkeleton v-if="!items.length" :rows="5" class="rounded-md border border-default bg-default" />
    <div v-else class="rounded-md border border-default bg-default px-6 py-2">
      <SCActivityRow
        v-for="(a, i) in items"
        :key="i"
        :when="a.when"
        :at="a.at"
        :repo="a.repo"
        :verb="a.verb"
        :rest="a.rest"
        :source="a.source"
        :href="a.href"
      />
    </div>
  </div>
</template>
