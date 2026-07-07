<script setup lang="ts">
import { organizerRoles } from '~/data/community'
</script>

<template>
  <div>
    <div
      v-for="(o, i) in organizerRoles"
      :key="`${o.event}-${o.period}-${i}`"
      class="grid grid-cols-[1fr_22px_1fr] gap-x-[22px]"
    >
      <!-- Left column (even indices) -->
      <div class="pb-7 text-right">
        <template v-if="i % 2 === 0">
          <div class="font-mono text-[11.5px] font-semibold tracking-[.05em] text-dimmed">{{ o.period }}</div>
          <div class="mt-1.5 text-[16px] font-bold tracking-tight text-highlighted">{{ o.event }}</div>
          <div class="mt-0.5 text-[13.5px] leading-relaxed text-muted">{{ o.role }}</div>
        </template>
      </div>

      <!-- Centre spine -->
      <div class="flex flex-col items-center">
        <span class="mt-[3px] size-[11px] flex-shrink-0 rounded-full bg-primary" />
        <span
          v-if="i < organizerRoles.length - 1"
          class="mt-[5px] w-px flex-1 bg-default"
        />
      </div>

      <!-- Right column (odd indices) -->
      <div class="pb-7">
        <template v-if="i % 2 === 1">
          <div class="font-mono text-[11.5px] font-semibold tracking-[.05em] text-dimmed">{{ o.period }}</div>
          <div class="mt-1.5 text-[16px] font-bold tracking-tight text-highlighted">{{ o.event }}</div>
          <div class="mt-0.5 text-[13.5px] leading-relaxed text-muted">{{ o.role }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
