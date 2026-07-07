<script setup lang="ts">
import { talks } from '~/data/talks'
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
    <div
      v-for="t in talks"
      :key="t.title"
      class="flex min-h-[210px] flex-col rounded-lg border border-default bg-default p-5"
    >
      <div class="mb-2.5 flex items-baseline justify-between gap-3">
        <span class="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary">{{ t.event }}</span>
        <span class="flex-shrink-0 font-mono text-[13px] font-bold text-dimmed">{{ t.year }}</span>
      </div>
      <h4 class="text-lg font-bold leading-tight tracking-tight text-highlighted">{{ t.title }}</h4>
      <p class="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted">{{ t.description }}</p>
      <div class="mt-4 flex flex-wrap gap-1.5">
        <span
          v-for="tag in t.tags"
          :key="tag"
          class="rounded bg-elevated px-2 py-1 font-mono text-[11px] font-medium text-dimmed"
        >{{ tag }}</span>
      </div>
    </div>
  </div>
</template>
