<script setup lang="ts">
import { activity as staticActivity } from '~/data/activity'

const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 30 })
const { activity: liveActivity } = useActivity()
const items = computed(() => {
  const all = liveActivity.value?.length ? liveActivity.value : staticActivity
  return all.slice(0, props.limit)
})
</script>

<template>
  <div class="rounded-md border border-default bg-default px-6 py-2">
    <SCActivityRow
      v-for="(a, i) in items"
      :key="i"
      :when="a.when"
      :repo="a.repo"
      :action="a.action"
      :href="a.href"
    />
  </div>
</template>
