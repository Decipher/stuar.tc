<script setup lang="ts">
import { activity as staticActivity } from '~/data/activity'

const { activity: liveActivity } = useActivity()
const items = computed(() => liveActivity.value?.length ? liveActivity.value : staticActivity)
</script>

<template>
  <div class="rounded-md border border-default bg-default px-6 py-2">
    <SCActivityRow
      v-for="a in items"
      :key="a.repo + a.when"
      :when="a.when"
      :repo="a.repo"
      :action="a.action"
      :href="a.href"
    />
  </div>
</template>
